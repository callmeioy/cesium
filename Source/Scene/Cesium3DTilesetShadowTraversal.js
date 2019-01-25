define([
        '../Core/Intersect',
        '../Core/ManagedArray',
        './Cesium3DTileRefine'
], function(
        Intersect,
        ManagedArray,
        Cesium3DTileRefine) {
    'use strict';

    /**
     * Traversal that loads tiles in the shadow map culling volume. If a tile that was originally selected
     * in the main traversal is no longer visible, but is still in the shadow map culling volume, it will be selected here.
     *
     * TODO : finish description
     *
     * @private
     */
    function Cesium3DTilesetShadowTraversal() {
    }

    var traversal = {
        stack : new ManagedArray(),
        stackMaximumLength : 0
    };

    Cesium3DTilesetShadowTraversal.selectTiles = function(tileset, frameState) {
        tileset._selectedTiles.length = 0;
        tileset._requestedTiles.length = 0;
        tileset._hasMixedContent = false;

        var root = tileset.root;
        root.updateVisibility(frameState);

        if (!isVisible(root)) {
            return;
        }

        var stack = traversal.stack;
        stack.push(tileset.root);

        while (stack.length > 0) {
            traversal.stackMaximumLength = Math.max(traversal.stackMaximumLength, stack.length);

            var tile = stack.pop();
            var add = (tile.refine === Cesium3DTileRefine.ADD);
            var replace = (tile.refine === Cesium3DTileRefine.REPLACE);
            var traverse = canTraverse(tileset, tile);

            if (traverse) {
                updateAndPushChildren(tileset, tile, stack, frameState);
            }

            if (add || (replace && !traverse)) {
                loadTile(tileset, tile);
                touchTile(tileset, tile);
                selectDesiredTile(tileset, tile, frameState);
            }

            visitTile(tileset);
        }

        traversal.stack.trim(traversal.stackMaximumLength);
    };

    function isVisible(tile) {
        return tile._visible && tile._inRequestVolume;
    }

    function hasEmptyContent(tile) {
        return tile.hasEmptyContent || tile.hasTilesetContent;
    }

    function hasUnloadedContent(tile) {
        return !hasEmptyContent(tile) && tile.contentUnloaded;
    }

    function canTraverse(tileset, tile) {
        if (tile.children.length === 0) {
            return false;
        }

        if (tile.hasTilesetContent) {
            // Traverse external tileset to visit its root tile
            // Don't traverse if the subtree is expired because it will be destroyed
            return !tile.contentExpired;
        }

        if (tile.hasEmptyContent) {
            return true;
        }

        return tile.geometricError > 16; // TODO  make this less hardcoded?
    }

    function updateAndPushChildren(tileset, tile, stack, frameState) {
        var children = tile.children;
        var length = children.length;

        for (var i = 0; i < length; ++i) {
            var child = children[i];
            child.updateVisibility(frameState);
            if (isVisible(child)) {
                stack.push(child);
            }
        }
    }

    function loadTile(tileset, tile) {
        if (hasUnloadedContent(tile) || tile.contentExpired) {
            tile._priority = 0.0; // Highest priority
            tileset._requestedTiles.push(tile);
        }
    }

    function touchTile(tileset, tile, frameState) {
        if (tile._touchedFrame === frameState.frameNumber) {
            // Prevents another pass from touching the frame again
            return;
        }
        tileset._cache.touch(tile);
        tile._touchedFrame = frameState.frameNumber;
    }

    function visitTile(tileset) {
        ++tileset.statistics.visited;
    }

    function selectDesiredTile(tileset, tile, frameState) {
        if (tile.contentAvailable && (tile.contentVisibility(frameState) !== Intersect.OUTSIDE)) {
            tileset._selectedTiles.push(tile);
        }
    }

    return Cesium3DTilesetShadowTraversal;
});
