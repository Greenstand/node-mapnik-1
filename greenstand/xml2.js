const xml2 =`
<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE Map[]>
<Map font-directory="../test/data/map-a/" srs="+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs" maximum-extent="-20037508.3,-20037508.3,20037508.3,20037508.3" buffer-size="100">

<Parameters>
  <Parameter name="maximum-extent"><![CDATA[-20037508.3,-20037508.3,20037508.3,20037508.3]]></Parameter>
  <Parameter name="format">png</Parameter>
  <Parameter name="markers_symbolizer_caches_disabled"><![CDATA[false]]></Parameter>
  <Parameter name="interactivity_layer">layer0</Parameter>
  <Parameter name="interactivity_fields">id</Parameter>
</Parameters>

<!--
<Style name="style" opacity=".5" >
    <Rule>
        <PolygonSymbolizer fill="black" clip="false"/>
    </Rule>
</Style>

<Layer name="world" >
    <StyleName>style</StyleName>
    <Datasource>
        <Parameter name="file">data/world_merc.shp</Parameter>
        <Parameter name="encoding">iso-8859-1</Parameter>
        <Parameter name="type">shape</Parameter>
    </Datasource>
</Layer>
-->

<Style name="layer1" filter-mode="first" >
  <Rule>
    <PointSymbolizer
      file="../greenstand/images/original_size_shadowless.png"
      opacity="1.0"
      allow-overlap="true"
      ignore-placement="true"
      />
    <TextSymbolizer
      face-name="DejaVu Serif Condensed Bold Italic" 
      fill="black" 
      allow-overlap="true"
      size="14"
    >
      [count]
  </TextSymbolizer>
    <!--
    <MarkersSymbolizer fill="#ff6600" opacity="1" width="16" stroke="#ffffff" stroke-width="3" stroke-opacity="0.9" placement="point" marker-type="ellipse" allow-overlap="true" clip="true" />
    -->
  </Rule>
</Style>
<Style name="layer0" filter-mode="first" >
  <Rule>
    <Filter>[count] &lt;= 1000 </Filter>
    <ShieldSymbolizer
        face-name="Roboto Regular" 
        size="14" 
        fill="black"
        file="../greenstand/images/original_size_shadowless.png" 
        spacing="0" 
        allow-overlap="true"
    >
      [count_text]
    </ShieldSymbolizer>
  </Rule>
  <Rule>
    <Filter>[count] &gt; 1000 </Filter>
    <ShieldSymbolizer
        face-name="Roboto Regular" 
        size="14" 
        fill="black"
        file="../greenstand/images/original_size_shadowless.png" 
        spacing="0" 
        allow-overlap="true"
    >
      [count_text]
    </ShieldSymbolizer>
  </Rule>
</Style>
<Layer name="l1"
  cache-features="true"
  srs="+proj=longlat +datum=WGS84 +no_defs"
  >
    <StyleName>layer0</StyleName>
    <Datasource>
       <Parameter name="srid"><![CDATA[4326]]></Parameter>
       <Parameter name="user"><![CDATA[postgres]]></Parameter>
       <Parameter name="host"><![CDATA[172.17.0.2]]></Parameter>
       <Parameter name="port"><![CDATA[5432]]></Parameter>
       <Parameter name="password"><![CDATA[greenstand]]></Parameter>
       <Parameter name="type"><![CDATA[postgis]]></Parameter>
       <Parameter name="extent"><![CDATA[-20037508.3,-20037508.3,20037508.3,20037508.3]]></Parameter>
       <Parameter name="max_size"><![CDATA[10]]></Parameter>
       <Parameter name="table"><![CDATA[(select * from trees) as cdbq]]></Parameter>
       <Parameter name="dbname"><![CDATA[treetracker_dev]]></Parameter>
       <Parameter name="geometry_field"><![CDATA[estimated_geometric_location]]></Parameter>
       <Parameter name="connect_timeout">180</Parameter>
    </Datasource>
  </Layer>


    <Style name="points" filter-mode="first">
        <Rule>
            <!--
            <Filter>[mapnik::geometry_type]=point and [marker-path]</Filter>
            -->
            <PointSymbolizer
              file="./images/tree_icon.png"
              opacity="0.1"
              allow-overlap="true"
              ignore-placement="true"
            />
        </Rule>
    </Style>
<Layer name="layer" srs="+proj=longlat +datum=WGS84 +no_defs  <>">
    <StyleName>layer0</StyleName>
    <Datasource>
        <Parameter name="type">geojson</Parameter>
        <Parameter name="inline"><![CDATA[{"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"Point","coordinates":[-10,10]},"properties":{"count":1, "count_text":"1"}},{"type":"Feature","geometry":{"type":"Point","coordinates":[-10,20]},"properties":{"count":1, "count_text":"1"}}]}]]></Parameter>
    </Datasource>
</Layer>


</Map>
`;

const xmlTree2 =`
<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE Map[]>
<Map font-directory="../test/data/map-a/" srs="+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs" maximum-extent="-20037508.3,-20037508.3,20037508.3,20037508.3" buffer-size="100">

<Parameters>
  <Parameter name="maximum-extent"><![CDATA[-20037508.3,-20037508.3,20037508.3,20037508.3]]></Parameter>
  <Parameter name="format">png</Parameter>
  <Parameter name="markers_symbolizer_caches_disabled"><![CDATA[false]]></Parameter>
  <Parameter name="interactivity_layer">layer0</Parameter>
  <Parameter name="interactivity_fields">id</Parameter>
</Parameters>

<!--
<Style name="style" opacity=".5" >
    <Rule>
        <PolygonSymbolizer fill="black" clip="false"/>
    </Rule>
</Style>

<Layer name="world" >
    <StyleName>style</StyleName>
    <Datasource>
        <Parameter name="file">data/world_merc.shp</Parameter>
        <Parameter name="encoding">iso-8859-1</Parameter>
        <Parameter name="type">shape</Parameter>
    </Datasource>
</Layer>
-->

<Style name="layer0" filter-mode="first" >
  <Rule>
    <PointSymbolizer
      file="../greenstand/images/trees.png"
      opacity="1.0"
      allow-overlap="true"
      ignore-placement="true"
      transform="scale(0.33)"
      />
    <!--
    <MarkersSymbolizer fill="#ff6600" opacity="1" width="16" stroke="#ffffff" stroke-width="3" stroke-opacity="0.9" placement="point" marker-type="ellipse" allow-overlap="true" clip="true" />
    -->
  </Rule>
</Style>
<Layer name="l1"
  cache-features="true"
  srs="+proj=longlat +datum=WGS84 +no_defs"
  >
    <StyleName>layer0</StyleName>
    <Datasource>
       <Parameter name="srid"><![CDATA[4326]]></Parameter>
       <Parameter name="user"><![CDATA[postgres]]></Parameter>
       <Parameter name="host"><![CDATA[172.17.0.2]]></Parameter>
       <Parameter name="port"><![CDATA[5432]]></Parameter>
       <Parameter name="password"><![CDATA[greenstand]]></Parameter>
       <Parameter name="type"><![CDATA[postgis]]></Parameter>
       <Parameter name="extent"><![CDATA[-20037508.3,-20037508.3,20037508.3,20037508.3]]></Parameter>
       <Parameter name="max_size"><![CDATA[10]]></Parameter>
       <Parameter name="table"><![CDATA[(select * from trees) as cdbq]]></Parameter>
       <Parameter name="dbname"><![CDATA[treetracker_dev]]></Parameter>
       <Parameter name="geometry_field"><![CDATA[estimated_geometric_location]]></Parameter>
       <Parameter name="connect_timeout">180</Parameter>
    </Datasource>
  </Layer>


</Map>
`;

const xmlTree3 = xmlTree2.replace(/transform="scale\(0.33\)"/, 'transform="scale(0.27)"');

const xmlJson2 = `
<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE Map[]>
<Map font-directory="../test/data/map-a/" srs="+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs" maximum-extent="-20037508.3,-20037508.3,20037508.3,20037508.3" buffer-size="100">

<Parameters>
  <Parameter name="maximum-extent"><![CDATA[-20037508.3,-20037508.3,20037508.3,20037508.3]]></Parameter>
  <Parameter name="format">png</Parameter>
  <Parameter name="markers_symbolizer_caches_disabled"><![CDATA[false]]></Parameter>
  <Parameter name="interactivity_layer">layer0</Parameter>
  <Parameter name="interactivity_fields">id</Parameter>
</Parameters>

<!--
<Style name="style" opacity=".5" >
    <Rule>
        <PolygonSymbolizer fill="black" clip="false"/>
    </Rule>
</Style>

<Layer name="world" >
    <StyleName>style</StyleName>
    <Datasource>
        <Parameter name="file">data/world_merc.shp</Parameter>
        <Parameter name="encoding">iso-8859-1</Parameter>
        <Parameter name="type">shape</Parameter>
    </Datasource>
</Layer>
-->

<Style name="layer1" filter-mode="first" >
  <Rule>
    <PointSymbolizer
      file="../greenstand/images/original_size_shadowless.svg"
      opacity="1.0"
      allow-overlap="true"
      ignore-placement="true"
      />
    <TextSymbolizer
      face-name="DejaVu Serif Condensed Bold Italic" 
      fill="black" 
      allow-overlap="true"
      size="14"
    >
      [count]
  </TextSymbolizer>
    <!--
    <MarkersSymbolizer fill="#ff6600" opacity="1" width="16" stroke="#ffffff" stroke-width="3" stroke-opacity="0.9" placement="point" marker-type="ellipse" allow-overlap="true" clip="true" />
    -->
  </Rule>
</Style>
<Style name="layer0" filter-mode="first" >
  <Rule>
    <Filter>[count] &lt;= 1000 </Filter>
    <ShieldSymbolizer
        face-name="Lato Regular" 
        size="14" 
        fill="black"
        file="../greenstand/images/original_size_shadowless.png" 
        spacing="0" 
        allow-overlap="true"
        transform="scale(1)"
        shield-dy="-4"
    >
      [count_text]
    </ShieldSymbolizer>
  </Rule>
  <Rule>
    <Filter>[count] &gt; 1000 </Filter>
    <ShieldSymbolizer
        face-name="Lato Regular" 
        size="14" 
        fill="black"
        file="../greenstand/images/original_size_shadowless.png" 
        spacing="0" 
        allow-overlap="true"
        transform="scale(1)"
        shield-dy="-4"
    >
      [count_text]
    </ShieldSymbolizer>
  </Rule>
</Style>


    <Style name="points" filter-mode="first">
        <Rule>
            <!--
            <Filter>[mapnik::geometry_type]=point and [marker-path]</Filter>
            -->
            <PointSymbolizer
              file="./images/tree_icon.png"
              opacity="0.1"
              allow-overlap="true"
              ignore-placement="true"
            />
        </Rule>
    </Style>
<Layer name="l1" srs="+proj=longlat +datum=WGS84 +no_defs  <>">
    <StyleName>layer0</StyleName>
    <Datasource>
        <Parameter name="type">geojson</Parameter>
        <Parameter name="inline"><![CDATA[json_data]]></Parameter>
    </Datasource>
</Layer>


</Map>
`;

const xmlJson3 = xmlJson2.replace(/transform="scale\(1\)"/g, 'transform="scale(0.81)"')
  .replace(/shield-dy="-4"/g, 'shield-dy="-2"')
  .replace(/size="14"/g, 'size="12"');

const xmlJsonForTree2 = `
<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE Map[]>
<Map font-directory="../test/data/map-a/" srs="+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs" maximum-extent="-20037508.3,-20037508.3,20037508.3,20037508.3" buffer-size="100">

<Parameters>
  <Parameter name="maximum-extent"><![CDATA[-20037508.3,-20037508.3,20037508.3,20037508.3]]></Parameter>
  <Parameter name="format">png</Parameter>
  <Parameter name="markers_symbolizer_caches_disabled"><![CDATA[false]]></Parameter>
  <Parameter name="interactivity_layer">layer0</Parameter>
  <Parameter name="interactivity_fields">id</Parameter>
</Parameters>

<!--
<Style name="style" opacity=".5" >
    <Rule>
        <PolygonSymbolizer fill="black" clip="false"/>
    </Rule>
</Style>

<Layer name="world" >
    <StyleName>style</StyleName>
    <Datasource>
        <Parameter name="file">data/world_merc.shp</Parameter>
        <Parameter name="encoding">iso-8859-1</Parameter>
        <Parameter name="type">shape</Parameter>
    </Datasource>
</Layer>
-->

<Style name="layer0" filter-mode="first" >
  <Rule>
    <PointSymbolizer
      file="../greenstand/images/tree_icon.png"
      opacity="1.0"
      allow-overlap="true"
      ignore-placement="true"
      />
    <!--
    <MarkersSymbolizer fill="#ff6600" opacity="1" width="16" stroke="#ffffff" stroke-width="3" stroke-opacity="0.9" placement="point" marker-type="ellipse" allow-overlap="true" clip="true" />
    -->
  </Rule>
</Style>


<Layer name="l1" srs="+proj=longlat +datum=WGS84 +no_defs  <>">
    <StyleName>layer0</StyleName>
    <Datasource>
        <Parameter name="type">geojson</Parameter>
        <Parameter name="inline"><![CDATA[json_data]]></Parameter>
    </Datasource>
</Layer>


</Map>
`;

module.exports = {
  xml2,
  xmlTree2,
  xmlTree3,
  xmlJson2,
  xmlJson3,
  xmlJsonForTree2,
}
