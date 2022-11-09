/*
 * Case1, search DB via active_tree_region table,
 * V2, use join to filter organization trees
 */
const SQLCase1 = require("./SQLCase1");

class SQLCase1V2 extends SQLCase1 {

  constructor() {
    super();
  }

  getJoin() {
    let result = "";
    if (this.isFilteringByUserId) {
      result += "JOIN trees ON tree_region.tree_id = trees.id";
    }
    if (this.mapName) {
      result += `
        INNER JOIN
        (  
            SELECT id as org_tree_id FROM (
              SELECT trees.id as id from trees
                WHERE 
                  planter_id IN (
                    SELECT id FROM planter
                    JOIN (
                      SELECT id AS entity_id FROM organization_children LIMIT 20
                    ) org ON planter.organization_id = org.entity_id
                  )
              UNION
                select id from trees where planting_organization_id = (
                select id from entity where map_name = '${this.mapName}'
                )
              ) idsx

        ) tree_ids
        ON tree_region.tree_id = tree_ids.org_tree_id`;
    }
    return result;
  }

  addMapNameFilter(mapName) {
    this.mapName = mapName;
  }

}

module.exports = SQLCase1V2;
