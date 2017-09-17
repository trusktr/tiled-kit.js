var Tiled = Tiled || {};

// plugin-pixi-tilemap

(function(exports) {

    var Collision = exports.Collision;
    var TileSet = exports.TileSet;
    var TileLayer = exports.TileLayer;
    var IsometricTileLayer = exports.IsometricTileLayer;
    var StaggeredTileLayer = exports.StaggeredTileLayer;
    var ObjectTileLayer = exports.ObjectTileLayer;
    var Map = exports.Map;

    TileLayer.prototype.updateTilemap = function(tilemap) {
        var scale = this.scale;

        var pivotX, pivotY;
        var viewOriginX, viewOriginY;
        var x, y;

        if (this.originX === null) {
            pivotX = this.viewX;
            viewOriginX = x = 0;
        } else {
            pivotX = this.originX;
            viewOriginX = this.originX - this.viewX;
            x = viewOriginX * scale;
        }

        if (this.originY === null) {
            pivotY = this.viewY;
            viewOriginY = y = 0;
        } else {
            pivotY = this.originY;
            viewOriginY = this.originY - this.viewY;
            y = viewOriginY * scale;
        }

        tilemap.pivot.set(pivotX, pivotY);
        tilemap.position.set(x, y);
        tilemap.scale.set(scale, scale);

        var changed = this.scaleChanged || this.originChanged || this.scrolled;
        if (changed || this.updateCount === 0) {

            var tileWidth = this.tileWidth;
            var tileHeight = this.tileHeight;
            var mapData = this.mapData;

            var startRow = this.viewRow;
            var endRow = this.viewEndRow;
            var startCol = this.viewCol;
            var endCol = this.viewEndCol;

            tilemap.clear();

            for (var r = startRow; r < endRow; r++) {
                var rowData = mapData[r];
                if (!rowData) {
                    continue;
                }
                for (var c = startCol; c < endCol; c++) {
                    var gid = rowData[c];
                    if (!gid || gid === 0) {
                        continue;
                    }
                    var tileIndex = gid - 1;
                    tilemap.addFrame(tileIndex, c * tileWidth, r * tileHeight);
                }
            }
        }
        this.updateCount++;
        this.restoreChangedState();
    };

    ////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////

    IsometricTileLayer.prototype.updateTilemap = function(tilemap) {
        var scale = this.scale;

        var pivotX, pivotY;
        var viewOriginX, viewOriginY;
        var x, y;

        if (this.originX === null) {
            pivotX = this.viewX;
            viewOriginX = x = 0;
        } else {
            pivotX = this.originX;
            viewOriginX = this.originX - this.viewX;
            x = viewOriginX * scale;
        }

        if (this.originY === null) {
            pivotY = this.viewY;
            viewOriginY = y = 0;
        } else {
            pivotY = this.originY;
            viewOriginY = this.originY - this.viewY;
            y = viewOriginY * scale;
        }

        tilemap.pivot.set(pivotX, pivotY);
        tilemap.position.set(x, y);
        tilemap.scale.set(scale, scale);

        var changed = this.scaleChanged || this.originChanged || this.scrolled;
        if (changed || this.updateCount === 0) {

            var tileWidth = this.tileWidth;
            var tileHeight = this.tileHeight;
            var mapData = this.mapData;

            var startRow = this.viewRow;
            var endRow = this.viewEndRow;
            var startCol = this.viewCol;
            var endCol = this.viewEndCol;

            tilemap.clear();

            var dataCol = Math.ceil((startCol * 2 + startRow) / 2);
            var dataRow = startRow - dataCol;
            var evenRow = startRow % 2 === 0;

            for (var r = startRow; r < endRow; r++) {
                var col = dataCol;
                var row = dataRow;
                for (var c = startCol; c < endCol; c++) {
                    var rowData = mapData[row];
                    if (rowData) {
                        var gid = rowData[col];
                        if (gid) {
                            var tileIndex = gid - 1;

                            var x = c * this.tileWidth + (r % 2 !== 0 ? 0 : this.halfTileWidth);
                            var y = (r - 1) * this.halfTileHeight;

                            tilemap.addFrame(tileIndex, x, y);
                        }
                    }
                    col++;
                    row--;
                }

                if (evenRow) {
                    dataCol++;
                } else {
                    dataRow++;
                }
                evenRow = !evenRow;
            }
        }

        this.updateCount++;
        this.restoreChangedState();

    };

    ////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////

    StaggeredTileLayer.prototype.updateTilemap = function(tilemap) {

        var scale = this.scale;

        var pivotX, pivotY;
        var viewOriginX, viewOriginY;
        var x, y;

        if (this.originX === null) {
            pivotX = this.viewX;
            viewOriginX = x = 0;
        } else {
            pivotX = this.originX;
            viewOriginX = this.originX - this.viewX;
            x = viewOriginX * scale;
        }

        if (this.originY === null) {
            pivotY = this.viewY;
            viewOriginY = y = 0;
        } else {
            pivotY = this.originY;
            viewOriginY = this.originY - this.viewY;
            y = viewOriginY * scale;
        }

        tilemap.pivot.set(pivotX, pivotY);
        tilemap.position.set(x, y);
        tilemap.scale.set(scale, scale);

        var changed = this.scaleChanged || this.originChanged || this.scrolled;
        if (changed || this.updateCount === 0) {

            var tileWidth = this.tileWidth;
            var tileHeight = this.tileHeight;
            var halfTileWidth = this.halfTileWidth;
            var halfTileHeight = this.halfTileHeight;
            var mapData = this.mapData;

            var startRow = this.viewRow;
            var endRow = this.viewEndRow;
            var startCol = this.viewCol;
            var endCol = this.viewEndCol;

            tilemap.clear();

            var evenRow = startRow % 2 === 0;

            for (var r = startRow; r < endRow; r++) {
                var rowData = mapData[r];
                if (rowData) {
                    for (var c = startCol; c < endCol; c++) {
                        var gid = rowData[c];
                        if (!gid || gid === 0) {
                            continue;
                        }
                        var tileIndex = gid - 1;
                        var x = c * tileWidth + (evenRow ? 0 : halfTileWidth);
                        var y = (r - 1) * halfTileHeight;
                        tilemap.addFrame(tileIndex, x, y);
                    }
                }
                evenRow = !evenRow;
            }
        }

        //     var dataCol = Math.ceil((startCol * 2 + startRow) / 2);
        //     var dataRow = startRow - dataCol;
        //     var evenRow = startRow % 2 === 0;

        //     for (var r = startRow; r < endRow; r++) {
        //         var col = dataCol;
        //         var row = dataRow;
        //         for (var c = startCol; c < endCol; c++) {
        //             var rowData = mapData[row];
        //             if (rowData) {
        //                 var gid = rowData[col];
        //                 if (gid) {
        //                     var tileIndex = gid - 1;

        //                     var x = c * this.tileWidth - (r % 2 !== 0 ? 0 : this.halfTileWidth);
        //                     var y = (r - 1) * this.halfTileHeight;

        //                     tilemap.addFrame(tileIndex, x, y);
        //                 }
        //             }
        //             col++;
        //             row--;
        //         }

        //         if (evenRow) {
        //             dataCol++;
        //         } else {
        //             dataRow++;
        //         }
        //         evenRow = !evenRow;
        //     }
        // }

        this.updateCount++;
        this.restoreChangedState();
    };

}(Tiled));