/* 동네쪽지 지도 스타일 — OpenFreeMap 벡터 타일(OpenMapTiles 스키마, 무료·키 없음)을 종이 테마로 단순하게 그린다.
 * 아이콘·가게 이름은 빼고 물·공원·길·건물·동네 이름만. 이름은 한국어(name:ko) 우선. */
(function () {
  'use strict';
  const PAL = {
    day:   { bg: '#f6efdf', park: '#e2e9c6', wood: '#d9e3bb', water: '#cfe2e6', bldg: '#ece2cc', road: '#ffffff', roadLine: '#e6d9be', major: '#fff8e6', majorLine: '#e8cf9c', path: '#dccdb0', rail: '#d3c4a6', border: '#c7b693', label: '#6b5a48', label2: '#8b7b69', halo: '#f6efdf', waterLabel: '#6f97a3' },
    night: { bg: '#2a251f', park: '#323726', wood: '#2f3524', water: '#1d2a30', bldg: '#352f27', road: '#4a4136', roadLine: '#3a3229', major: '#5a4d3c', majorLine: '#6b5a44', path: '#463d33', rail: '#4b4134', border: '#6b5d4a', label: '#e9ddc8', label2: '#bfae95', halo: '#2a251f', waterLabel: '#8fb3be' },
  };
  const NAME = ['coalesce', ['get', 'name:ko'], ['get', 'name']];
  const FONT = ['Noto Sans Regular'];
  const W = (pairs) => ['interpolate', ['exponential', 1.5], ['zoom']].concat(pairs);

  function style(night) {
    const c = night ? PAL.night : PAL.day;
    const roadsMinor = ['in', ['get', 'class'], ['literal', ['minor', 'service', 'track']]];
    const roadsMid = ['in', ['get', 'class'], ['literal', ['secondary', 'tertiary']]];
    const roadsMajor = ['in', ['get', 'class'], ['literal', ['motorway', 'trunk', 'primary']]];
    return {
      version: 8,
      glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
      sources: { omt: { type: 'vector', url: 'https://tiles.openfreemap.org/planet' } },
      layers: [
        { id: 'bg', type: 'background', paint: { 'background-color': c.bg } },
        { id: 'wood', type: 'fill', source: 'omt', 'source-layer': 'landcover', filter: ['in', ['get', 'class'], ['literal', ['wood', 'grass', 'forest']]], paint: { 'fill-color': c.wood, 'fill-opacity': 0.8 } },
        { id: 'park', type: 'fill', source: 'omt', 'source-layer': 'park', paint: { 'fill-color': c.park } },
        { id: 'landuse-green', type: 'fill', source: 'omt', 'source-layer': 'landuse', filter: ['in', ['get', 'class'], ['literal', ['cemetery', 'pitch', 'garden', 'playground']]], paint: { 'fill-color': c.park, 'fill-opacity': 0.8 } },
        { id: 'water', type: 'fill', source: 'omt', 'source-layer': 'water', paint: { 'fill-color': c.water } },
        { id: 'waterway', type: 'line', source: 'omt', 'source-layer': 'waterway', minzoom: 10, paint: { 'line-color': c.water, 'line-width': W([10, 1, 16, 4]) } },
        { id: 'building', type: 'fill', source: 'omt', 'source-layer': 'building', minzoom: 15, paint: { 'fill-color': c.bldg, 'fill-opacity': ['interpolate', ['linear'], ['zoom'], 15, 0, 16, 0.85] } },
        { id: 'boundary', type: 'line', source: 'omt', 'source-layer': 'boundary', filter: ['all', ['<=', ['get', 'admin_level'], 4], ['!=', ['get', 'maritime'], 1]], paint: { 'line-color': c.border, 'line-width': 1, 'line-dasharray': [3, 2] } },
        { id: 'path', type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom: 15, filter: ['==', ['get', 'class'], 'path'], paint: { 'line-color': c.path, 'line-width': 1, 'line-dasharray': [2, 1.5] } },
        { id: 'rail', type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom: 12, filter: ['all', ['in', ['get', 'class'], ['literal', ['rail', 'transit']]], ['!=', ['get', 'brunnel'], 'tunnel']], paint: { 'line-color': c.rail, 'line-width': 1.2, 'line-dasharray': [4, 3] } },
        { id: 'minor-case', type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom: 13, filter: roadsMinor, layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': c.roadLine, 'line-width': W([13, 1.5, 18, 14]) } },
        { id: 'minor', type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom: 13, filter: roadsMinor, layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': c.road, 'line-width': W([13, 0.8, 18, 11]) } },
        { id: 'mid-case', type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom: 10, filter: roadsMid, layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': c.roadLine, 'line-width': W([10, 1, 18, 20]) } },
        { id: 'mid', type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom: 10, filter: roadsMid, layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': c.road, 'line-width': W([10, 0.6, 18, 16]) } },
        { id: 'major-case', type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom: 6, filter: roadsMajor, layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': c.majorLine, 'line-width': W([6, 0.8, 18, 26]) } },
        { id: 'major', type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom: 6, filter: roadsMajor, layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': c.major, 'line-width': W([6, 0.4, 18, 22]) } },
        { id: 'road-name', type: 'symbol', source: 'omt', 'source-layer': 'transportation_name', minzoom: 15, layout: { 'symbol-placement': 'line', 'text-field': NAME, 'text-font': FONT, 'text-size': 11 }, paint: { 'text-color': c.label2, 'text-halo-color': c.halo, 'text-halo-width': 1.5 } },
        { id: 'water-name', type: 'symbol', source: 'omt', 'source-layer': 'water_name', minzoom: 11, layout: { 'text-field': NAME, 'text-font': FONT, 'text-size': 12 }, paint: { 'text-color': c.waterLabel, 'text-halo-color': c.halo, 'text-halo-width': 1.5 } },
        { id: 'station', type: 'symbol', source: 'omt', 'source-layer': 'poi', minzoom: 14, filter: ['all', ['==', ['get', 'class'], 'railway'], ['==', ['get', 'subclass'], 'station']], layout: { 'text-field': ['concat', '🚇 ', NAME], 'text-font': FONT, 'text-size': 11 }, paint: { 'text-color': c.label2, 'text-halo-color': c.halo, 'text-halo-width': 1.5 } },
        { id: 'place-small', type: 'symbol', source: 'omt', 'source-layer': 'place', minzoom: 12, filter: ['in', ['get', 'class'], ['literal', ['suburb', 'quarter', 'neighbourhood', 'village']]], layout: { 'text-field': NAME, 'text-font': FONT, 'text-size': ['interpolate', ['linear'], ['zoom'], 12, 11, 16, 14], 'text-max-width': 7 }, paint: { 'text-color': c.label, 'text-halo-color': c.halo, 'text-halo-width': 2 } },
        { id: 'place-city', type: 'symbol', source: 'omt', 'source-layer': 'place', maxzoom: 14, filter: ['in', ['get', 'class'], ['literal', ['city', 'town']]], layout: { 'text-field': NAME, 'text-font': FONT, 'text-size': ['interpolate', ['linear'], ['zoom'], 6, 12, 12, 17] }, paint: { 'text-color': c.label, 'text-halo-color': c.halo, 'text-halo-width': 2 } },
      ],
    };
  }
  window.DN_MAP_STYLE = style;
})();
