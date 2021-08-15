/*
 * Case3, to filter and count all stuff via trees table directly, it would be slow if the data set is huge
 */

class SQLCase3{

  constructor(){
    this.isFilteringByUserId = false;
    this.userId = undefined;
  }


  setZoomLevel(zoomLevel){
    this.zoomLevel = zoomLevel;
  }

  getZoomLevel(){
    return this.zoomLevel;
  }

  getClusterRadius(){
    //calculate cluster radius by zoom level
    parseInt(this.zoomLevel)
      switch (this.zoomLevel) {
            case 1:
                return 10;
              case 2:
                return 8;
              case 3:
                return 6;
              case 4:
                return 4;
              case 5:
                return 0.8;
              case 6:
                return 0.75;
              case 7:
                return 0.3;
              case 8:
                return 0.099;
              case 9:
                return 0.095;
              case 10:
                return 0.05;
              case 11:
                return 0.03;
              case 12:
                return 0.02;
              case 13:
                return 0.008;
              case 14:
                return 0.005;
              case 15:
                return 0.004;
              case 16:
                return 0.003;
              case 17:
              case 18:
              case 19:
                return 0.0;
              default:
                return 0;
            }
  }

  addFilterByUserid(userid){
    this.userid = userid;
  }

  addFilterByWallet(wallet){
    this.wallet = wallet;
  }

  addFilterByFlavor(flavor){
    this.flavor = flavor;
  }

  addFilterByToken(token){
    this.token = token;
  }

  addFilterByMapName(mapName){
    this.mapName = mapName;
  }

  getFilter(){
    let result = "";
    if(this.userid){
      result += 'AND trees.planter_id = ' + this.userid + ' ';
    }
    if(this.wallet) {
      result += "AND wallet.wallet.name = '" + this.wallet + "'"
    }
    return result;
  }

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

  getJoin(){
    let result = "";
    if(this.wallet){
      result += 'INNER JOIN wallet.token ON wallet.token.capture_id::text = trees.uuid \n';
      result += 'INNER JOIN wallet.wallet ON wallet.wallet.id = wallet.token.wallet_id \n';
    }
    if(this.flavor){
      result += "INNER JOIN tree_attributes ON tree_attributes.tree_id = trees.id";
    }
    if(this.token){
      result += "INNER JOIN certificates ON trees.certificate_id = certificates.id AND certificates.token = '" + this.token + "'";
    }
    if(this.mapName){
      result += "INNER JOIN org_tree_id ON org_tree_id.id = trees.id";
    }
    return result;
  }

  getJoinCriteria(){
    let result = "";
    if(this.flavor){
      result += "AND tree_attributes.key = 'app_flavor' AND tree_attributes.value = '" + this.flavor + "'";
    }
    return result;
  }

  setBounds(bounds){
    this.bounds = bounds;
  }

  getBoundingBoxQuery(){
    let result = "";
    if (this.bounds) {
      result += 'AND trees.estimated_geometric_location && ST_MakeEnvelope(' + this.bounds + ', 4326) ';
    }
    return result;
  }

  getQuery(){
    console.log('Calculating clusters directly');
    const query =  `
        /* case3 tile */
        ${this.getWith()}
        SELECT 'cluster'                                           AS type,
        0 AS id,
        'case3 tile' AS log,
        NULL AS zoom_to,
        St_asgeojson(St_centroid(clustered_locations))                 latlon,
        St_centroid(clustered_locations) estimated_geometric_location,
        St_numgeometries(clustered_locations)                          count,
        CASE WHEN St_numgeometries(clustered_locations) > 1000 
        THEN  (St_numgeometries(clustered_locations) / 1000) || 'K'
        ELSE St_numgeometries(clustered_locations) || ''
        END AS count_text
        FROM   (
        SELECT Unnest(St_clusterwithin(estimated_geometric_location, ${this.getClusterRadius()})) clustered_locations
        FROM   trees 
        ${this.getJoin()}
        WHERE  active = true 
        ${this.getBoundingBoxQuery()} 
        ${this.getFilter()} 
        ${this.getJoinCriteria()}  
        ) clusters`;
    return query;
  }
}

module.exports = SQLCase3;
