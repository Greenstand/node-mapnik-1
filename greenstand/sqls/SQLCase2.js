/*
 * Search DB by trees table directly, like in the high zoom level, show trees
 * on the map;
 */



class SQLCase2{
  

  addTreeFilter(treeid){
    this.treeid = treeid;
  }

  addUUIDFilter(uuid){
    this.uuid = uuid;
  }


  addTreesFilter(){
    throw new Error("dedicated");
  }

  addFilterByUserId(userId){
    this.userId = userId;
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
    if(this.treeid){
      result += 'AND trees.id = ' + this.treeid + ' \n';
    }
    if(this.uuid){
      result += 'AND trees.uuid = ' + this.uuid + ' \n';
    }
    if(this.userId){
      result += "AND trees.planter_id = " + this.userId + " \n";
    }
    if(this.wallet) {
      result += "AND wallet.wallet.name = '" + this.wallet + "'"
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

  getJoinCriteria(){
    let result = "";
    if(this.flavor){
      result += "AND tree_attributes.key = 'app_flavor' AND tree_attributes.value = '" + this.flavor + "'";
    }
    if(this.token){
      result += "INNER JOIN certificates ON trees.certificate_id = certificates.id AND certificates.token = '" + this.token + "'";
    }
    return result;
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
    if(this.mapName){
      result += "INNER JOIN org_tree_id ON org_tree_id.id = trees.id";
    }
    return result;
  }

  getWith(){
    let withClause = `WITH placeholder AS (SELECT 1)`;
    if(this.mapName){
      withClause += `
        ,org_tree_id AS (
        SELECT trees.id as id from trees
          INNER JOIN (
            SELECT id FROM planter
            JOIN (
              SELECT entity_id FROM getEntityRelationshipChildren(
                (SELECT id FROM entity WHERE map_name = '${this.mapName}')
              ) LIMIT 20
            ) org ON planter.organization_id = org.entity_id
          ) planter_ids
          ON trees.planter_id = planter_ids.id
      )`;
    }
    return withClause;
  }

  getQuery(){
    let sql = `
      /* sql case2 tile */
      ${this.getWith()}
      SELECT /* DISTINCT ON(trees.id) */
      'case2 tile' AS log,
      estimated_geometric_location,
      St_asgeojson(estimated_geometric_location) latlon,
      'point' AS type,
       trees.id, 
       trees.lat, 
       trees.lon,
      NULL AS zoom_to,
      1 as count
      FROM trees 
      ${this.getJoin()}
      WHERE active = true 
      ${this.getBoundingBoxQuery()}
      ${this.getFilter()}
      ${this.getJoinCriteria()}
      ORDER BY ID DESC
    ` 
    ;
    console.log(sql);
    return sql;
  }
}


module.exports = SQLCase2;
