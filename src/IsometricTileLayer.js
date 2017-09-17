var Tiled = Tiled || {};

(function(exports) {

    var Collision = exports.Collision;
    var TileLayer = exports.TileLayer;

    // the `view` is viewport.
    // the `screen` is not physical screen.

    var IsometricTileLayer = exports.IsometricTileLayer = function(options) {
        for (var key in options) {
            this[key] = options[key];
        }
    };

    var proto = {
        constructor: IsometricTileLayer,

        halfTileWidth: null,
        halfTileHeight: null,

        viewScaleY: null,
        viewScaleZ: null,
        viewRotation: Math.PI / 4,

        init: function() {
            this.gridSize = Math.max(this.cols, this.rows);
            this.width = this.tileWidth * this.gridSize;
            this.height = this.tileHeight * this.gridSize;

            this.tileSide = this.tileSide || Math.sqrt(Math.pow(this.tileWidth, 2) / 2);
            this.halfTileWidth = this.tileWidth / 2;
            this.halfTileHeight = this.tileHeight / 2;

            this.viewScaleY = this.viewScaleY || this.tileHeight / this.tileWidth;
            this.viewScaleZ = Math.sqrt(1 - this.viewScaleY * this.viewScaleY);
            this.cos = Math.cos(this.viewRotation);
            this.sin = Math.sin(this.viewRotation);

            this.mapWidth = (this.mapCols + this.mapRows) * this.halfTileWidth;
            this.mapHeight = (this.mapCols + this.mapRows) * this.halfTileHeight;

            this.maxViewCol = this.maxViewCol === null ? (this.mapCols + this.mapRows) : this.maxViewCol;
            this.maxViewRow = this.maxViewRow === null ? (this.mapCols + this.mapRows) : this.maxViewRow;

            this.restoreChangedState();
            this.setOrigin(this.originX, this.originY);
            this.setScale(this.scale, true);
        },

        initCollision: function(options) {
            options = options || {};

            options.mapData = this.mapData;
            options.mapCols = this.mapCols;
            options.mapRows = this.mapRows;
            options.tileWidth = this.tileSide;
            options.tileHeight = this.tileSide;

            this.collision = new Collision(options);
        },

        // originX & originY is map system
        // tileWidthScaled & tileHeightScaled is screen system
        setScale: function(scale, force) {
            scale = Math.max(this.minScale, Math.min(this.maxScale, scale));

            this.scaleChanged = this.scale !== scale;

            if (!force && !this.scaleChanged && !this.originChanged) {
                return false;
            }

            this.tileWidthScaled = this.tileWidth * scale;
            this.tileHeightScaled = this.tileHeight * scale;

            this.halfTileWidthScaled = this.halfTileWidth * scale;
            this.halfTileHeightScaled = this.halfTileHeight * scale;

            this.viewCols = Math.ceil(this.viewWidth / this.tileWidthScaled + 1) + 1;
            this.viewRows = Math.ceil(this.viewHeight / this.halfTileHeightScaled + 1) + 1;

            this.viewWidthScaled = this.viewWidth / scale;
            this.viewHeightScaled = this.viewHeight / scale;

            // this.viewWidthFull = this.viewCols * this.tileWidthScaled;
            // this.viewHeightFull = this.viewRows * this.tileHeightScaled;

            var viewOriginX = this.originX === null ? 0 : this.originX - this.viewX;
            var viewOriginY = this.originY === null ? 0 : this.originY - this.viewY;

            var d = 1 - this.scale / scale;
            var ox = viewOriginX * d;
            var oy = viewOriginY * d;

            this.scale = scale;

            this.setViewPos(this.viewX + ox, this.viewY + oy, true);

            return true;
        },

        // x & y is map system
        // viewX & viewY is map system
        // viewWidth & viewHeight is map system
        // viewWidthScaled & viewWidthScaled is screen system
        setViewPos: function(x, y, force) {
            var minX = this.minViewX || 0;
            var maxX = this.maxViewX === null ? this.mapWidth - this.viewWidthScaled : this.maxViewX;

            var minY = this.minViewY || 0;
            var maxY = this.maxViewY === null ? this.mapHeight - this.viewHeightScaled : this.maxViewY;

            x = Math.max(minX, Math.min(maxX, x));
            y = Math.max(minY, Math.min(maxY, y));

            this.viewPosChanged = this.viewX !== x || this.viewY !== y;
            this.scrolled = false;

            if (!force && !this.viewPosChanged) {
                // console.log("viewX === x && viewY === y", x, y);
                return false;
            }

            var lastCol = this.viewCol;
            var lastRow = this.viewRow;

            var col = Math.floor(x / this.tileWidth);
            var row = Math.floor(y / this.halfTileHeight) - 1;

            if (this.extCols !== 0) {
                col = Math.max(this.minViewCol, col - this.extCols);
                this.viewCols += this.extCols + this.extCols;
            }

            if (this.extRows !== 0) {
                row = Math.max(this.minViewRow, row - this.extRows);
                this.viewRows += this.extRows + this.extRows;
            }

            this.viewEndCol = Math.min(this.maxViewCol, col + this.viewCols);
            this.viewEndRow = Math.min(this.maxViewRow, row + this.viewRows);

            this.tileOffsetX = col * this.tileWidth - x;
            this.tileOffsetY = row * this.halfTileHeight - y;

            this.viewX = x;
            this.viewY = y;

            this.viewCol = col;
            this.viewRow = row;

            this.scrolled = lastCol !== col || lastRow !== row;

            return true;
        },

        mapTileToView: function(col, row) {
            var newCol = Math.floor((col - row) / 2);
            var newRow = col + row;
            return {
                col: newCol,
                row: newRow
            };
        },

        viewTileToMap: function(col, row) {
            var newCol = Math.ceil(col + row / 2);
            var newRow = row - newCol;
            return {
                col: newCol,
                row: newRow
            };
        },

        // x & y is view system
        viewToMap: function(x, y) {
            x = x / this.scale;
            y = y / this.scale / this.viewScaleY;
            return {
                x: x * this.cos + y * this.sin,
                y: -x * this.sin + y * this.cos
            };
        },

        // x & y is map system
        mapToView: function(x, y) {
            var newX = x * this.cos - y * this.sin;
            var newY = x * this.sin + y * this.cos;

            return {
                x: newX * this.scale,
                y: newY * this.viewScaleY * this.scale
            };
        },

        // x & y is screen system
        screenToMap: function(x, y) {
            x = x / this.scale + this.viewX;
            y = (y / this.scale + this.viewY) / this.viewScaleY;
            return {
                x: x * this.cos + y * this.sin,
                y: -x * this.sin + y * this.cos
            };
        },

        // x & y is map system
        mapToScreen: function(x, y) {
            var newX = x * this.cos - y * this.sin;
            var newY = x * this.sin + y * this.cos;

            return {
                x: (newX - this.viewX) * this.scale,
                y: (newY * this.viewScaleY - this.viewY) * this.scale
            };
        },

        // x & y is screen system
        getTileFromScreen: function(x, y) {
            x = x / this.scale + this.viewX;
            y = (y / this.scale + this.viewY) / this.viewScaleY;

            var newX = x * this.cos + y * this.sin;
            var newY = -x * this.sin + y * this.cos;

            var col = Math.floor(newX / this.tileSide);
            var row = Math.floor(newY / this.tileSide);

            // var vt = this.mapTileToScreen(col, row);
            // var mt = this.screenTileToMap(vt.col, vt.row);
            // console.log('vvvvvvvvvv');
            // console.log('map', col, row);
            // console.log('view', vt.col, vt.row);

            // console.log(col, row, '----', mt.col, mt.row);
            // console.log('^^^^^^^^^');
            return {
                col: col,
                row: row
            };
        },


    };

    for (var p in TileLayer.prototype) {
        IsometricTileLayer.prototype[p] = TileLayer.prototype[p];
    }

    for (var p in proto) {
        IsometricTileLayer.prototype[p] = proto[p];
    }

}(Tiled));