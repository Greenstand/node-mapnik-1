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

  getJoin(){
    let result = "";
    if(this.isFilteringByUserId){
      result += "JOIN trees ON tree_region.tree_id = trees.id";
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
    if(this.mapName){
      result += `
        AND tree_region.tree_id IN(
          select distinct * from ( 
            SELECT trees.id as id from trees
              INNER JOIN (
                SELECT id FROM planter
                JOIN (
                  SELECT
                    UNNEST(children) AS entity_id
                    FROM
                      organization_children
                      WHERE
                        map_name = '${this.mapName}'
                ) org ON planter.organization_id = org.entity_id
              ) planter_ids
              ON trees.planter_id = planter_ids.id
          union all 
            SELECT trees.id as id from trees
              INNER JOIN (
                SELECT id FROM planter
                JOIN (
                  SELECT
                    UNNEST(children) AS entity_id
                    FROM
                      organization_children
                      WHERE
                        map_name = '${this.mapName}'
                ) org ON planter.organization_id = org.entity_id
              ) planter_ids
              ON trees.planter_id = planter_ids.id
          ) t1
        )
      `;
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

  getQuery(){
    //TODO check the conflict case, like: can not set userid and treeIds at the same time
    const text = `
      /* sql case1 tile */
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
