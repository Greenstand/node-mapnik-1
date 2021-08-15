/*
 * Case1, search DB via active_tree_region table,
 */

class SQLCase1{

  constructor(){
    this.isFilteringByUserId = false;
    this.userId = undefined;
  }

  addFilterByUserId(userId){
    this.isFilteringByUserId = true;
    this.userId = userId;
  }

  addFilterByWallet(wallet){
    this.wallet = wallet;
  }

  getJoin(){
    let result = "";
    if(this.isFilteringByUserId || this.wallet){
      result += "JOIN trees ON tree_region.tree_id = trees.id\n";
    }
    if(this.mapName){
      result += "INNER JOIN org_tree_id ON org_tree_id.id = tree_region.tree_id\n";
    }
    if(this.wallet){
      result += 'INNER JOIN wallet.token ON wallet.token.capture_id::text = trees.uuid \n';
      result += 'INNER JOIN wallet.wallet ON wallet.wallet.id = wallet.token.wallet_id \n';
    }
    return result;
  }

  getFilter(){
    let result = "";
    if(this.isFilteringByUserId){
      result += "AND planter_id = " + this.userId + " ";
    }
    if(this.treeIds && this.treeIds.length > 0){
      result += "AND tree_region.tree_id IN(" + this.treeIds.join(",") + ") ";
    }
    if(this.wallet) {
      result += "AND wallet.wallet.name = '" + this.wallet + "'"
    }
    return result;
  }

  setZoomLevel(zoomLevel){
    this.zoomLevel = zoomLevel;
  }

  getZoomLevel(){
    if(!this.zoomLevel){
      throw new Error("zoom level required");
    }
    return this.zoomLevel;
  }

  setBounds(bounds){
    this.bounds = bounds;
  }

  getBoundingBoxQuery(){
    let result = "";
    if (this.bounds) {
      result += ' AND centroid && ST_MakeEnvelope(' + this.bounds + ', 4326) \n';
    }
    return result;
  }

  addMapNameFilter(mapName){
    this.mapName = mapName;
  }

  /*
   * The with cause
   */
  getWith(){
    let withClause = `WITH placeholder AS (SELECT 1)`;
    if(this.mapName){
      //replace the withClause 
      withClause = `
        WITH RECURSIVE organization_children AS (
           SELECT entity.id, entity_relationship.parent_id, 1 as depth, entity_relationship.type, entity_relationship.role
           FROM entity
           LEFT JOIN entity_relationship ON entity_relationship.child_id = entity.id 
           WHERE entity.id IN (SELECT id FROM entity WHERE map_name = '${this.mapName}')
          UNION
           SELECT next_child.id, entity_relationship.parent_id, depth + 1, entity_relationship.type, entity_relationship.role
           FROM entity next_child
           JOIN entity_relationship ON entity_relationship.child_id = next_child.id 
           JOIN organization_children c ON entity_relationship.parent_id = c.id
          )
            ,org_tree_id AS (
            SELECT trees.id as id from trees
              INNER JOIN (
                SELECT id FROM planter
                JOIN (
                  SELECT id AS entity_id FROM organization_children LIMIT 20
                ) org ON planter.organization_id = org.entity_id
              ) planter_ids
              ON trees.planter_id = planter_ids.id
            )
     	`;
    }
    return withClause;
  }

  getQuery(options = {}){
    //TODO check the conflict case, like: can not set userid and treeIds at the same time
    const text = `
      /* sql case1 tile */
      ${!options.disableWith && this.getWith() || ""}
      SELECT 
      'cluster' AS type,
      'case1 tile' AS log,
      NULL AS zoom_to,
      region_id id, 
      ${this.getZoomLevel() === 2?
      "st_point(LEAST(st_x(centroid), 170), st_y(centroid)) estimated_geometric_location,St_asgeojson(st_point(LEAST(st_x(centroid), 170), st_y(centroid))) latlon,"
        :
      "centroid estimated_geometric_location,St_asgeojson(centroid) latlon,"
      }
      type_id as region_type,
      count(tree_region.id) count,
      CASE WHEN count(tree_region.id) > 1000 
      THEN  (count(tree_region.id) / 1000) || 'K'
      ELSE count(tree_region.id) || ''
      END AS count_text
      FROM active_tree_region tree_region
      ${this.getJoin()}
      WHERE zoom_level = ${this.getZoomLevel()}
      ${this.getFilter()}
      ${this.getBoundingBoxQuery()}
      GROUP BY region_id, centroid, type_id`;
    return text;
  }
}

module.exports = SQLCase1;
