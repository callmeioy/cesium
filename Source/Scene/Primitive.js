import BoundingSphere from '../Core/BoundingSphere.js';
import Cartesian2 from '../Core/Cartesian2.js';
import Cartesian3 from '../Core/Cartesian3.js';
import Cartesian4 from '../Core/Cartesian4.js';
import Cartographic from '../Core/Cartographic.js';
import clone from '../Core/clone.js';
import Color from '../Core/Color.js';
import combine from '../Core/combine.js';
import ComponentDatatype from '../Core/ComponentDatatype.js';
import defaultValue from '../Core/defaultValue.js';
import defined from '../Core/defined.js';
import defineProperties from '../Core/defineProperties.js';
import destroyObject from '../Core/destroyObject.js';
import DeveloperError from '../Core/DeveloperError.js';
import EncodedCartesian3 from '../Core/EncodedCartesian3.js';
import FeatureDetection from '../Core/FeatureDetection.js';
import Geometry from '../Core/Geometry.js';
import GeometryAttribute from '../Core/GeometryAttribute.js';
import GeometryAttributes from '../Core/GeometryAttributes.js';
import GeometryOffsetAttribute from '../Core/GeometryOffsetAttribute.js';
import Intersect from '../Core/Intersect.js';
import isArray from '../Core/isArray.js';
import Matrix4 from '../Core/Matrix4.js';
import Plane from '../Core/Plane.js';
import RuntimeError from '../Core/RuntimeError.js';
import subdivideArray from '../Core/subdivideArray.js';
import TaskProcessor from '../Core/TaskProcessor.js';
import BufferUsage from '../Renderer/BufferUsage.js';
import ContextLimits from '../Renderer/ContextLimits.js';
import DrawCommand from '../Renderer/DrawCommand.js';
import Pass from '../Renderer/Pass.js';
import RenderState from '../Renderer/RenderState.js';
import ShaderProgram from '../Renderer/ShaderProgram.js';
import ShaderSource from '../Renderer/ShaderSource.js';
import VertexArray from '../Renderer/VertexArray.js';
import when from '../ThirdParty/when.js';
import BatchTable from './BatchTable.js';
import CullFace from './CullFace.js';
import DepthFunction from './DepthFunction.js';
import PrimitivePipeline from './PrimitivePipeline.js';
import PrimitiveState from './PrimitiveState.js';
import SceneMode from './SceneMode.js';
import ShadowMode from './ShadowMode.js';

    /**
     * A primitive represents geometry in the {@link Scene}.  The geometry can be from a single {@link GeometryInstance}
     * as shown in example 1 below, or from an array of instances, even if the geometry is from different
     * geometry types, e.g., an {@link RectangleGeometry} and an {@link EllipsoidGeometry} as shown in Code Example 2.
     * <p>
     * A primitive combines geometry instances with an {@link Appearance} that describes the full shading, including
     * {@link Material} and {@link RenderState}.  Roughly, the geometry instance defines the structure and placement,
     * and the appearance defines the visual characteristics.  Decoupling geometry and appearance allows us to mix
     * and match most of them and add a new geometry or appearance independently of each other.
     * </p>
     * <p>
     * Combining multiple instances into one primitive is called batching, and significantly improves performance for static data.
     * Instances can be individually picked; {@link Scene#pick} returns their {@link GeometryInstance#id}.  Using
     * per-instance appearances like {@link PerInstanceColorAppearance}, each instance can also have a unique color.
     * </p>
     * <p>
     * {@link Geometry} can either be created and batched on a web worker or the main thread. The first two examples
     * show geometry that will be created on a web worker by using the descriptions of the geometry. The third example
     * shows how to create the geometry on the main thread by explicitly calling the <code>createGeometry</code> method.
     * </p>
     *
     * @alias Primitive
     * @constructor
     *
     * @param {Object} [options] Object with the following properties:
     * @param {GeometryInstance[]|GeometryInstance} [options.geometryInstances] The geometry instances - or a single geometry instance - to render.
     * @param {Appearance} [options.appearance] The appearance used to render the primitive.
     * @param {Appearance} [options.depthFailAppearance] The appearance used to shade this primitive when it fails the depth test.
     * @param {Boolean} [options.show=true] Determines if this primitive will be shown.
     * @param {Matrix4} [options.modelMatrix=Matrix4.IDENTITY] The 4x4 transformation matrix that transforms the primitive (all geometry instances) from model to world coordinates.
     * @param {Boolean} [options.vertexCacheOptimize=false] When <code>true</code>, geometry vertices are optimized for the pre and post-vertex-shader caches.
     * @param {Boolean} [options.interleave=false] When <code>true</code>, geometry vertex attributes are interleaved, which can slightly improve rendering performance but increases load time.
     * @param {Boolean} [options.compressVertices=true] When <code>true</code>, the geometry vertices are compressed, which will save memory.
     * @param {Boolean} [options.releaseGeometryInstances=true] When <code>true</code>, the primitive does not keep a reference to the input <code>geometryInstances</code> to save memory.
     * @param {Boolean} [options.allowPicking=true] When <code>true</code>, each geometry instance will only be pickable with {@link Scene#pick}.  When <code>false</code>, GPU memory is saved.
     * @param {Boolean} [options.cull=true] When <code>true</code>, the renderer frustum culls and horizon culls the primitive's commands based on their bounding volume.  Set this to <code>false</code> for a small performance gain if you are manually culling the primitive.
     * @param {Boolean} [options.asynchronous=true] Determines if the primitive will be created asynchronously or block until ready.
     * @param {Boolean} [options.debugShowBoundingVolume=false] For debugging only. Determines if this primitive's commands' bounding spheres are shown.
     * @param {ShadowMode} [options.shadows=ShadowMode.DISABLED] Determines whether this primitive casts or receives shadows from each light source.
     *
     * @example
     * // 1. Draw a translucent ellipse on the surface with a checkerboard pattern
     * var instance = new Cesium.GeometryInstance({
     *   geometry : new Cesium.EllipseGeometry({
     *       center : Cesium.Cartesian3.fromDegrees(-100.0, 20.0),
     *       semiMinorAxis : 500000.0,
     *       semiMajorAxis : 1000000.0,
     *       rotation : Cesium.Math.PI_OVER_FOUR,
     *       vertexFormat : Cesium.VertexFormat.POSITION_AND_ST
     *   }),
     *   id : 'object returned when this instance is picked and to get/set per-instance attributes'
     * });
     * scene.primitives.add(new Cesium.Primitive({
     *   geometryInstances : instance,
     *   appearance : new Cesium.EllipsoidSurfaceAppearance({
     *     material : Cesium.Material.fromType('Checkerboard')
     *   })
     * }));
     *
     * @example
     * // 2. Draw different instances each with a unique color
     * var rectangleInstance = new Cesium.GeometryInstance({
     *   geometry : new Cesium.RectangleGeometry({
     *     rectangle : Cesium.Rectangle.fromDegrees(-140.0, 30.0, -100.0, 40.0),
     *     vertexFormat : Cesium.PerInstanceColorAppearance.VERTEX_FORMAT
     *   }),
     *   id : 'rectangle',
     *   attributes : {
     *     color : new Cesium.ColorGeometryInstanceAttribute(0.0, 1.0, 1.0, 0.5)
     *   }
     * });
     * var ellipsoidInstance = new Cesium.GeometryInstance({
     *   geometry : new Cesium.EllipsoidGeometry({
     *     radii : new Cesium.Cartesian3(500000.0, 500000.0, 1000000.0),
     *     vertexFormat : Cesium.VertexFormat.POSITION_AND_NORMAL
     *   }),
     *   modelMatrix : Cesium.Matrix4.multiplyByTranslation(Cesium.Transforms.eastNorthUpToFixedFrame(
     *     Cesium.Cartesian3.fromDegrees(-95.59777, 40.03883)), new Cesium.Cartesian3(0.0, 0.0, 500000.0), new Cesium.Matrix4()),
     *   id : 'ellipsoid',
     *   attributes : {
     *     color : Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.AQUA)
     *   }
     * });
     * scene.primitives.add(new Cesium.Primitive({
     *   geometryInstances : [rectangleInstance, ellipsoidInstance],
     *   appearance : new Cesium.PerInstanceColorAppearance()
     * }));
     *
     * @example
     * // 3. Create the geometry on the main thread.
     * scene.primitives.add(new Cesium.Primitive({
     *   geometryInstances : new Cesium.GeometryInstance({
     *       geometry : Cesium.EllipsoidGeometry.createGeometry(new Cesium.EllipsoidGeometry({
     *         radii : new Cesium.Cartesian3(500000.0, 500000.0, 1000000.0),
     *         vertexFormat : Cesium.VertexFormat.POSITION_AND_NORMAL
     *       })),
     *       modelMatrix : Cesium.Matrix4.multiplyByTranslation(Cesium.Transforms.eastNorthUpToFixedFrame(
     *         Cesium.Cartesian3.fromDegrees(-95.59777, 40.03883)), new Cesium.Cartesian3(0.0, 0.0, 500000.0), new Cesium.Matrix4()),
     *       id : 'ellipsoid',
     *       attributes : {
     *         color : Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.AQUA)
     *       }
     *   }),
     *   appearance : new Cesium.PerInstanceColorAppearance()
     * }));
     *
     * @see GeometryInstance
     * @see Appearance
     * @see ClassificationPrimitive
     * @see GroundPrimitive
     */
    function Primitive(options) {
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);

        /**
         * The geometry instances rendered with this primitive.  This may
         * be <code>undefined</code> if <code>options.releaseGeometryInstances</code>
         * is <code>true</code> when the primitive is constructed.
         * <p>
         * Changing this property after the primitive is rendered has no effect.
         * </p>
         *
         * @readonly
         * @type GeometryInstance[]|GeometryInstance
         *
         * @default undefined
         */
        this.geometryInstances = options.geometryInstances;

        /**
         * The {@link Appearance} used to shade this primitive. Each geometry
         * instance is shaded with the same appearance.  Some appearances, like
         * {@link PerInstanceColorAppearance} allow giving each instance unique
         * properties.
         *
         * @type Appearance
         *
         * @default undefined
         */
        this.appearance = options.appearance;
        this._appearance = undefined;
        this._material = undefined;

        /**
         * The {@link Appearance} used to shade this primitive when it fails the depth test. Each geometry
         * instance is shaded with the same appearance.  Some appearances, like
         * {@link PerInstanceColorAppearance} allow giving each instance unique
         * properties.
         *
         * <p>
         * When using an appearance that requires a color attribute, like PerInstanceColorAppearance,
         * add a depthFailColor per-instance attribute instead.
         * </p>
         *
         * <p>
         * Requires the EXT_frag_depth WebGL extension to render properly. If the extension is not supported,
         * there may be artifacts.
         * </p>
         * @type Appearance
         *
         * @default undefined
         */
        this.depthFailAppearance = options.depthFailAppearance;
        this._depthFailAppearance = undefined;
        this._depthFailMaterial = undefined;

        /**
         * The 4x4 transformation matrix that transforms the primitive (all geometry instances) from model to world coordinates.
         * When this is the identity matrix, the primitive is drawn in world coordinates, i.e., Earth's WGS84 coordinates.
         * Local reference frames can be used by providing a different transformation matrix, like that returned
         * by {@link Transforms.eastNorthUpToFixedFrame}.
         *
         * <p>
         * This property is only supported in 3D mode.
         * </p>
         *
         * @type Matrix4
         *
         * @default Matrix4.IDENTITY
         *
         * @example
         * var origin = Cesium.Cartesian3.fromDegrees(-95.0, 40.0, 200000.0);
         * p.modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(origin);
         */
        this.modelMatrix = Matrix4.clone(defaultValue(options.modelMatrix, Matrix4.IDENTITY));
        this._modelMatrix = new Matrix4();

        /**
         * Determines if the primitive will be shown.  This affects all geometry
         * instances in the primitive.
         *
         * @type Boolean
         *
         * @default true
         */
        this.show = defaultValue(options.show, true);

        this._vertexCacheOptimize = defaultValue(options.vertexCacheOptimize, false);
        this._interleave = defaultValue(options.interleave, false);
        this._releaseGeometryInstances = defaultValue(options.releaseGeometryInstances, true);
        this._allowPicking = defaultValue(options.allowPicking, true);
        this._asynchronous = defaultValue(options.asynchronous, true);
        this._compressVertices = defaultValue(options.compressVertices, true);

        /**
         * When <code>true</code>, the renderer frustum culls and horizon culls the primitive's commands
         * based on their bounding volume.  Set this to <code>false</code> for a small performance gain
         * if you are manually culling the primitive.
         *
         * @type {Boolean}
         *
         * @default true
         */
        this.cull = defaultValue(options.cull, true);

        /**
         * This property is for debugging only; it is not for production use nor is it optimized.
         * <p>
         * Draws the bounding sphere for each draw command in the primitive.
         * </p>
         *
         * @type {Boolean}
         *
         * @default false
         */
        this.debugShowBoundingVolume = defaultValue(options.debugShowBoundingVolume, false);

        /**
         * @private
         */
        this.rtcCenter = options.rtcCenter;

        //>>includeStart('debug', pragmas.debug);
        if (defined(this.rtcCenter) && (!defined(this.geometryInstances) || (isArray(this.geometryInstances) && this.geometryInstances.length !== 1))) {
            throw new DeveloperError('Relative-to-center rendering only supports one geometry instance.');
        }
        //>>includeEnd('debug');

        /**
         * Determines whether this primitive casts or receives shadows from each light source.
         *
         * @type {ShadowMode}
         *
         * @default ShadowMode.DISABLED
         */
        this.shadows = defaultValue(options.shadows, ShadowMode.DISABLED);

        this._translucent = undefined;

        this._state = PrimitiveState.READY;
        this._geometries = [];
        this._error = undefined;
        this._numberOfInstances = 0;

        this._boundingSpheres = [];
        this._boundingSphereWC = [];
        this._boundingSphereCV = [];
        this._boundingSphere2D = [];
        this._boundingSphereMorph = [];
        this._perInstanceAttributeCache = [];
        this._instanceIds = [];
        this._lastPerInstanceAttributeIndex = 0;

        this._va = [];
        this._attributeLocations = undefined;
        this._primitiveType = undefined;

        this._frontFaceRS = undefined;
        this._backFaceRS = undefined;
        this._sp = undefined;

        this._depthFailAppearance = undefined;
        this._spDepthFail = undefined;
        this._frontFaceDepthFailRS = undefined;
        this._backFaceDepthFailRS = undefined;

        this._pickIds = [];

        this._colorCommands = [];
        this._pickCommands = [];

        this._readOnlyInstanceAttributes = options._readOnlyInstanceAttributes;

        this._createBoundingVolumeFunction = options._createBoundingVolumeFunction;
        this._createRenderStatesFunction = options._createRenderStatesFunction;
        this._createShaderProgramFunction = options._createShaderProgramFunction;
        this._createCommandsFunction = options._createCommandsFunction;
        this._updateAndQueueCommandsFunction = options._updateAndQueueCommandsFunction;

        this._createPickOffsets = options._createPickOffsets;
        this._pickOffsets = undefined;

        this._createGeometryResults = undefined;
        this._ready = false;
        this._readyPromise = when.defer();

        this._batchTable = undefined;
        this._batchTableAttributeIndices = undefined;
        this._offsetInstanceExtend = undefined;
        this._batchTableOffsetAttribute2DIndex = undefined;
        this._batchTableOffsetsUpdated = false;
        this._instanceBoundingSpheres = undefined;
        this._instanceBoundingSpheresCV = undefined;
        this._tempBoundingSpheres = undefined;
        this._recomputeBoundingSpheres = false;
        this._batchTableBoundingSpheresUpdated = false;
        this._batchTableBoundingSphereAttributeIndices = undefined;
    }

    defineProperties(Primitive.prototype, {
        /**
         * When <code>true</code>, geometry vertices are optimized for the pre and post-vertex-shader caches.
         *
         * @memberof Primitive.prototype
         *
         * @type {Boolean}
         * @readonly
         *
         * @default true
         */
        vertexCacheOptimize : {
            get : function() {
                return this._vertexCacheOptimize;
            }
        },

        /**
         * Determines if geometry vertex attributes are interleaved, which can slightly improve rendering performance.
         *
         * @memberof Primitive.prototype
         *
         * @type {Boolean}
         * @readonly
         *
         * @default false
         */
        interleave : {
            get : function() {
                return this._interleave;
            }
        },

        /**
         * When <code>true</code>, the primitive does not keep a reference to the input <code>geometryInstances</code> to save memory.
         *
         * @memberof Primitive.prototype
         *
         * @type {Boolean}
         * @readonly
         *
         * @default true
         */
        releaseGeometryInstances : {
            get : function() {
                return this._releaseGeometryInstances;
            }
        },

        /**
         * When <code>true</code>, each geometry instance will only be pickable with {@link Scene#pick}.  When <code>false</code>, GPU memory is saved.         *
         *
         * @memberof Primitive.prototype
         *
         * @type {Boolean}
         * @readonly
         *
         * @default true
         */
        allowPicking : {
            get : function() {
                return this._allowPicking;
            }
        },

        /**
         * Determines if the geometry instances will be created and batched on a web worker.
         *
         * @memberof Primitive.prototype
         *
         * @type {Boolean}
         * @readonly
         *
         * @default true
         */
        asynchronous : {
            get : function() {
                return this._asynchronous;
            }
        },

        /**
         * When <code>true</code>, geometry vertices are compressed, which will save memory.
         *
         * @memberof Primitive.prototype
         *
         * @type {Boolean}
         * @readonly
         *
         * @default true
         */
        compressVertices : {
            get : function() {
                return this._compressVertices;
            }
        },

        /**
         * Determines if the primitive is complete and ready to render.  If this property is
         * true, the primitive will be rendered the next time that {@link Primitive#update}
         * is called.
         *
         * @memberof Primitive.prototype
         *
         * @type {Boolean}
         * @readonly
         */
        ready : {
            get : function() {
                return this._ready;
            }
        },

        /**
         * Gets a promise that resolves when the primitive is ready to render.
         * @memberof Primitive.prototype
         * @type {Promise.<Primitive>}
         * @readonly
         */
        readyPromise : {
            get : function() {
                return this._readyPromise.promise;
            }
        }
    });

    function getCommonPerInstanceAttributeNames(instances) {
        var length = instances.length;

        var attributesInAllInstances = [];
        var attributes0 = instances[0].attributes;
        var name;

        for (name in attributes0) {
            if (attributes0.hasOwnProperty(name) && defined(attributes0[name])) {
                var attribute = attributes0[name];
                var inAllInstances = true;

                // Does this same attribute exist in all instances?
                for (var i = 1; i < length; ++i) {
                    var otherAttribute = instances[i].attributes[name];

                    if (!defined(otherAttribute) ||
                        (attribute.componentDatatype !== otherAttribute.componentDatatype) ||
                        (attribute.componentsPerAttribute !== otherAttribute.componentsPerAttribute) ||
                        (attribute.normalize !== otherAttribute.normalize)) {

                        inAllInstances = false;
                        break;
                    }
                }

                if (inAllInstances) {
                    attributesInAllInstances.push(name);
                }
            }
        }

        return attributesInAllInstances;
    }

    var scratchGetAttributeCartesian2 = new Cartesian2();
    var scratchGetAttributeCartesian3 = new Cartesian3();
    var scratchGetAttributeCartesian4 = new Cartesian4();

    function getAttributeValue(value) {
        var componentsPerAttribute = value.length;
        if (componentsPerAttribute === 1) {
            return value[0];
        } else if (componentsPerAttribute === 2) {
            return Cartesian2.unpack(value, 0, scratchGetAttributeCartesian2);
        } else if (componentsPerAttribute === 3) {
            return Cartesian3.unpack(value, 0, scratchGetAttributeCartesian3);
        } else if (componentsPerAttribute === 4) {
            return Cartesian4.unpack(value, 0, scratchGetAttributeCartesian4);
        }
    }

    function createBatchTable(primitive, context) {
        var geometryInstances = primitive.geometryInstances;
        var instances = (isArray(geometryInstances)) ? geometryInstances : [geometryInstances];
        var numberOfInstances = instances.length;
        if (numberOfInstances === 0) {
            return;
        }

        var names = getCommonPerInstanceAttributeNames(instances);
        var length = names.length;

        var attributes = [];
        var attributeIndices = {};
        var boundingSphereAttributeIndices = {};
        var offset2DIndex;

        var firstInstance = instances[0];
        var instanceAttributes = firstInstance.attributes;

        var i;
        var name;
        var attribute;

        for (i = 0; i < length; ++i) {
            name = names[i];
            attribute = instanceAttributes[name];

            attributeIndices[name] = i;
            attributes.push({
                functionName : 'czm_batchTable_' + name,
                componentDatatype : attribute.componentDatatype,
                componentsPerAttribute : attribute.componentsPerAttribute,
                normalize : attribute.normalize
            });
        }

        if (names.indexOf('distanceDisplayCondition') !== -1) {
            attributes.push({
                functionName : 'czm_batchTable_boundingSphereCenter3DHigh',
                componentDatatype : ComponentDatatype.FLOAT,
                componentsPerAttribute : 3
            }, {
                functionName : 'czm_batchTable_boundingSphereCenter3DLow',
                componentDatatype : ComponentDatatype.FLOAT,
                componentsPerAttribute : 3
            }, {
                functionName : 'czm_batchTable_boundingSphereCenter2DHigh',
                componentDatatype : ComponentDatatype.FLOAT,
                componentsPerAttribute : 3
            }, {
                functionName : 'czm_batchTable_boundingSphereCenter2DLow',
                componentDatatype : ComponentDatatype.FLOAT,
                componentsPerAttribute : 3
            }, {
                functionName : 'czm_batchTable_boundingSphereRadius',
                componentDatatype : ComponentDatatype.FLOAT,
                componentsPerAttribute : 1
            });
            boundingSphereAttributeIndices.center3DHigh = attributes.length - 5;
            boundingSphereAttributeIndices.center3DLow = attributes.length - 4;
            boundingSphereAttributeIndices.center2DHigh = attributes.length - 3;
            boundingSphereAttributeIndices.center2DLow = attributes.length - 2;
            boundingSphereAttributeIndices.radius = attributes.length - 1;
        }

        if (names.indexOf('offset') !== -1) {
            attributes.push({
                functionName : 'czm_batchTable_offset2D',
                componentDatatype : ComponentDatatype.FLOAT,
                componentsPerAttribute : 3
            });
            offset2DIndex = attributes.length - 1;
        }

        attributes.push({
            functionName : 'czm_batchTable_pickColor',
            componentDatatype : ComponentDatatype.UNSIGNED_BYTE,
            componentsPerAttribute : 4,
            normalize : true
        });

        var attributesLength = attributes.length;
        var batchTable = new BatchTable(context, attributes, numberOfInstances);

        for (i = 0; i < numberOfInstances; ++i) {
            var instance = instances[i];
            instanceAttributes = instance.attributes;

            for (var j = 0; j < length; ++j) {
                name = names[j];
                attribute = instanceAttributes[name];
                var value = getAttributeValue(attribute.value);
                var attributeIndex = attributeIndices[name];
                batchTable.setBatchedAttribute(i, attributeIndex, value);
            }

            var pickObject = {
                primitive : defaultValue(instance.pickPrimitive, primitive)
            };

            if (defined(instance.id)) {
                pickObject.id = instance.id;
            }

            var pickId = context.createPickId(pickObject);
            primitive._pickIds.push(pickId);

            var pickColor = pickId.color;
            var color = scratchGetAttributeCartesian4;
            color.x = Color.floatToByte(pickColor.red);
            color.y = Color.floatToByte(pickColor.green);
            color.z = Color.floatToByte(pickColor.blue);
            color.w = Color.floatToByte(pickColor.alpha);

            batchTable.setBatchedAttribute(i, attributesLength - 1, color);
        }

        primitive._batchTable = batchTable;
        primitive._batchTableAttributeIndices = attributeIndices;
        primitive._batchTableBoundingSphereAttributeIndices = boundingSphereAttributeIndices;
        primitive._batchTableOffsetAttribute2DIndex = offset2DIndex;
    }

    function cloneAttribute(attribute) {
        var clonedValues;
        if (isArray(attribute.values)) {
            clonedValues = attribute.values.slice(0);
        } else {
            clonedValues = new attribute.values.constructor(attribute.values);
        }
        return new GeometryAttribute({
            componentDatatype : attribute.componentDatatype,
            componentsPerAttribute : attribute.componentsPerAttribute,
            normalize : attribute.normalize,
            values : clonedValues
        });
    }

    function cloneGeometry(geometry) {
        var attributes = geometry.attributes;
        var newAttributes = new GeometryAttributes();
        for (var property in attributes) {
            if (attributes.hasOwnProperty(property) && defined(attributes[property])) {
                newAttributes[property] = cloneAttribute(attributes[property]);
            }
        }

        var indices;
        if (defined(geometry.indices)) {
            var sourceValues = geometry.indices;
            if (isArray(sourceValues)) {
                indices = sourceValues.slice(0);
            } else {
                indices = new sourceValues.constructor(sourceValues);
            }
        }

        return new Geometry({
            attributes : newAttributes,
            indices : indices,
            primitiveType : geometry.primitiveType,
            boundingSphere : BoundingSphere.clone(geometry.boundingSphere)
        });
    }

    function cloneInstance(instance, geometry) {
        return {
            geometry : geometry,
            attributes: instance.attributes,
            modelMatrix : Matrix4.clone(instance.modelMatrix),
            pickPrimitive : instance.pickPrimitive,
            id : instance.id
        };
    }

    var positionRegex = /attribute\s+vec(?:3|4)\s+(.*)3DHigh;/g;

    Primitive._modifyShaderPosition = function(primitive, vertexShaderSource, scene3DOnly) {
        var match;

        var forwardDecl = '';
        var attributes = '';
        var computeFunctions = '';

        while ((match = positionRegex.exec(vertexShaderSource)) !== null) {
            var name = match[1];

            var functionName = 'vec4 czm_compute' + name[0].toUpperCase() + name.substr(1) + '()';

            // Don't forward-declare czm_computePosition because computePosition.glsl already does.
            if (functionName !== 'vec4 czm_computePosition()') {
                forwardDecl += functionName + ';\n';
            }

            if (!defined(primitive.rtcCenter)) {
                // Use GPU RTE
                if (!scene3DOnly) {
                    attributes +=
                        'attribute vec3 ' + name + '2DHigh;\n' +
                        'attribute vec3 ' + name + '2DLow;\n';

                    computeFunctions +=
                        functionName + '\n' +
                        '{\n' +
                        '    vec4 p;\n' +
                        '    if (czm_morphTime == 1.0)\n' +
                        '    {\n' +
                        '        p = czm_translateRelativeToEye(' + name + '3DHigh, ' + name + '3DLow);\n' +
                        '    }\n' +
                        '    else if (czm_morphTime == 0.0)\n' +
                        '    {\n' +
                        '        p = czm_translateRelativeToEye(' + name + '2DHigh.zxy, ' + name + '2DLow.zxy);\n' +
                        '    }\n' +
                        '    else\n' +
                        '    {\n' +
                        '        p = czm_columbusViewMorph(\n' +
                        '                czm_translateRelativeToEye(' + name + '2DHigh.zxy, ' + name + '2DLow.zxy),\n' +
                        '                czm_translateRelativeToEye(' + name + '3DHigh, ' + name + '3DLow),\n' +
                        '                czm_morphTime);\n' +
                        '    }\n' +
                        '    return p;\n' +
                        '}\n\n';
                } else {
                    computeFunctions +=
                        functionName + '\n' +
                        '{\n' +
                        '    return czm_translateRelativeToEye(' + name + '3DHigh, ' + name + '3DLow);\n' +
                        '}\n\n';
                }
            } else {
                // Use RTC
                vertexShaderSource = vertexShaderSource.replace(/attribute\s+vec(?:3|4)\s+position3DHigh;/g, '');
                vertexShaderSource = vertexShaderSource.replace(/attribute\s+vec(?:3|4)\s+position3DLow;/g, '');

                forwardDecl += 'uniform mat4 u_modifiedModelView;\n';
                attributes += 'attribute vec4 position;\n';

                computeFunctions +=
                    functionName + '\n' +
                    '{\n' +
                    '    return u_modifiedModelView * position;\n' +
                    '}\n\n';

                vertexShaderSource = vertexShaderSource.replace(/czm_modelViewRelativeToEye\s+\*\s+/g, '');
                vertexShaderSource = vertexShaderSource.replace(/czm_modelViewProjectionRelativeToEye/g, 'czm_projection');
            }
        }

        return [forwardDecl, attributes, vertexShaderSource, computeFunctions].join('\n');
    };

    Primitive._appendShowToShader = function(primitive, vertexShaderSource) {
        if (!defined(primitive._batchTableAttributeIndices.show)) {
            return vertexShaderSource;
        }

        var renamedVS = ShaderSource.replaceMain(vertexShaderSource, 'czm_non_show_main');
        var showMain =
            'void main() \n' +
            '{ \n' +
            '    czm_non_show_main(); \n' +
            '    gl_Position *= czm_batchTable_show(batchId); \n' +
            '}';

        return renamedVS + '\n' + showMain;
    };

    Primitive._updateColorAttribute = function(primitive, vertexShaderSource, isDepthFail) {
        // some appearances have a color attribute for per vertex color.
        // only remove if color is a per instance attribute.
        if (!defined(primitive._batchTableAttributeIndices.color) && !defined(primitive._batchTableAttributeIndices.depthFailColor)) {
            return vertexShaderSource;
        }

        if (vertexShaderSource.search(/attribute\s+vec4\s+color;/g) === -1) {
            return vertexShaderSource;
        }

        //>>includeStart('debug', pragmas.debug);
        if (isDepthFail && !defined(primitive._batchTableAttributeIndices.depthFailColor)) {
            throw new DeveloperError('A depthFailColor per-instance attribute is required when using a depth fail appearance that uses a color attribute.');
        }
        //>>includeEnd('debug');

        var modifiedVS = vertexShaderSource;
        modifiedVS = modifiedVS.replace(/attribute\s+vec4\s+color;/g, '');
        if (!isDepthFail) {
            modifiedVS = modifiedVS.replace(/(\b)color(\b)/g, '$1czm_batchTable_color(batchId)$2');
        } else {
            modifiedVS = modifiedVS.replace(/(\b)color(\b)/g, '$1czm_batchTable_depthFailColor(batchId)$2');
        }
        return modifiedVS;
    };

    function appendPickToVertexShader(source) {
        var renamedVS = ShaderSource.replaceMain(source, 'czm_non_pick_main');
        var pickMain = 'varying vec4 v_pickColor; \n' +
                       'void main() \n' +
                       '{ \n' +
                       '    czm_non_pick_main(); \n' +
                       '    v_pickColor = czm_batchTable_pickColor(batchId); \n' +
                       '}';

        return renamedVS + '\n' + pickMain;
    }

    function appendPickToFragmentShader(source) {
        return 'varying vec4 v_pickColor;\n' + source;
    }

    Primitive._updatePickColorAttribute = function(source) {
        var vsPick = source.replace(/attribute\s+vec4\s+pickColor;/g, '');
        vsPick = vsPick.replace(/(\b)pickColor(\b)/g, '$1czm_batchTable_pickColor(batchId)$2');
        return vsPick;
    };

    Primitive._appendOffsetToShader = function(primitive, vertexShaderSource) {
        if (!defined(primitive._batchTableAttributeIndices.offset)) {
            return vertexShaderSource;
        }

        var attr = 'attribute float batchId;\n';
        attr += 'attribute float applyOffset;';
        var modifiedShader = vertexShaderSource.replace(/attribute\s+float\s+batchId;/g, attr);

        var str = 'vec4 $1 = czm_computePosition();\n';
        str += '    if (czm_sceneMode == czm_sceneMode3D)\n';
        str += '    {\n';
        str += '        $1 = $1 + vec4(czm_batchTable_offset(batchId) * applyOffset, 0.0);';
        str += '    }\n';
        str += '    else\n';
        str += '    {\n';
        str += '        $1 = $1 + vec4(czm_batchTable_offset2D(batchId) * applyOffset, 0.0);';
        str += '    }\n';
        modifiedShader = modifiedShader.replace(/vec4\s+([A-Za-z0-9_]+)\s+=\s+czm_computePosition\(\);/g, str);
        return modifiedShader;
    };

    Primitive._appendDistanceDisplayConditionToShader = function(primitive, vertexShaderSource, scene3DOnly) {
        if (!defined(primitive._batchTableAttributeIndices.distanceDisplayCondition)) {
            return vertexShaderSource;
        }

        var renamedVS = ShaderSource.replaceMain(vertexShaderSource, 'czm_non_distanceDisplayCondition_main');
        var distanceDisplayConditionMain =
            'void main() \n' +
            '{ \n' +
            '    czm_non_distanceDisplayCondition_main(); \n' +
            '    vec2 distanceDisplayCondition = czm_batchTable_distanceDisplayCondition(batchId);\n' +
            '    vec3 boundingSphereCenter3DHigh = czm_batchTable_boundingSphereCenter3DHigh(batchId);\n' +
            '    vec3 boundingSphereCenter3DLow = czm_batchTable_boundingSphereCenter3DLow(batchId);\n' +
            '    float boundingSphereRadius = czm_batchTable_boundingSphereRadius(batchId);\n';

        if (!scene3DOnly) {
            distanceDisplayConditionMain +=
                '    vec3 boundingSphereCenter2DHigh = czm_batchTable_boundingSphereCenter2DHigh(batchId);\n' +
                '    vec3 boundingSphereCenter2DLow = czm_batchTable_boundingSphereCenter2DLow(batchId);\n' +
                '    vec4 centerRTE;\n' +
                '    if (czm_morphTime == 1.0)\n' +
                '    {\n' +
                '        centerRTE = czm_translateRelativeToEye(boundingSphereCenter3DHigh, boundingSphereCenter3DLow);\n' +
                '    }\n' +
                '    else if (czm_morphTime == 0.0)\n' +
                '    {\n' +
                '        centerRTE = czm_translateRelativeToEye(boundingSphereCenter2DHigh.zxy, boundingSphereCenter2DLow.zxy);\n' +
                '    }\n' +
                '    else\n' +
                '    {\n' +
                '        centerRTE = czm_columbusViewMorph(\n' +
                '                czm_translateRelativeToEye(boundingSphereCenter2DHigh.zxy, boundingSphereCenter2DLow.zxy),\n' +
                '                czm_translateRelativeToEye(boundingSphereCenter3DHigh, boundingSphereCenter3DLow),\n' +
                '                czm_morphTime);\n' +
                '    }\n';
        } else {
            distanceDisplayConditionMain +=
                '    vec4 centerRTE = czm_translateRelativeToEye(boundingSphereCenter3DHigh, boundingSphereCenter3DLow);\n';
        }

        distanceDisplayConditionMain +=
            '    float radiusSq = boundingSphereRadius * boundingSphereRadius; \n' +
            '    float distanceSq; \n' +
            '    if (czm_sceneMode == czm_sceneMode2D) \n' +
            '    { \n' +
            '        distanceSq = czm_eyeHeight2D.y - radiusSq; \n' +
            '    } \n' +
            '    else \n' +
            '    { \n' +
            '        distanceSq = dot(centerRTE.xyz, centerRTE.xyz) - radiusSq; \n' +
            '    } \n' +
            '    distanceSq = max(distanceSq, 0.0); \n' +
            '    float nearSq = distanceDisplayCondition.x * distanceDisplayCondition.x; \n' +
            '    float farSq = distanceDisplayCondition.y * distanceDisplayCondition.y; \n' +
            '    float show = (distanceSq >= nearSq && distanceSq <= farSq) ? 1.0 : 0.0; \n' +
            '    gl_Position *= show; \n' +
            '}';
        return renamedVS + '\n' + distanceDisplayConditionMain;
    };

    function modifyForEncodedNormals(primitive, vertexShaderSource) {
        if (!primitive.compressVertices) {
            return vertexShaderSource;
        }

        var containsNormal = vertexShaderSource.search(/attribute\s+vec3\s+normal;/g) !== -1;
        var containsSt = vertexShaderSource.search(/attribute\s+vec2\s+st;/g) !== -1;
        if (!containsNormal && !containsSt) {
            return vertexShaderSource;
        }

        var containsTangent = vertexShaderSource.search(/attribute\s+vec3\s+tangent;/g) !== -1;
        var containsBitangent = vertexShaderSource.search(/attribute\s+vec3\s+bitangent;/g) !== -1;

        var numComponents = containsSt && containsNormal ? 2.0 : 1.0;
        numComponents += containsTangent || containsBitangent ? 1 : 0;

        var type = (numComponents > 1) ? 'vec' + numComponents : 'float';

        var attributeName = 'compressedAttributes';
        var attributeDecl = 'attribute ' + type + ' ' + attributeName + ';';

        var globalDecl = '';
        var decode = '';

        if (containsSt) {
            globalDecl += 'vec2 st;\n';
            var stComponent = numComponents > 1 ? attributeName + '.x' : attributeName;
            decode += '    st = czm_decompressTextureCoordinates(' + stComponent + ');\n';
        }

        if (containsNormal && containsTangent && containsBitangent) {
            globalDecl +=
                'vec3 normal;\n' +
                'vec3 tangent;\n' +
                'vec3 bitangent;\n';
            decode += '    czm_octDecode(' + attributeName + '.' + (containsSt ? 'yz' : 'xy') + ', normal, tangent, bitangent);\n';
        } else {
            if (containsNormal) {
                globalDecl += 'vec3 normal;\n';
                decode += '    normal = czm_octDecode(' + attributeName + (numComponents > 1 ? '.' + (containsSt ? 'y' : 'x') : '') + ');\n';
            }

            if (containsTangent) {
                globalDecl += 'vec3 tangent;\n';
                decode += '    tangent = czm_octDecode(' + attributeName + '.' + (containsSt && containsNormal ? 'z' : 'y') + ');\n';
            }

            if (containsBitangent) {
                globalDecl += 'vec3 bitangent;\n';
                decode += '    bitangent = czm_octDecode(' + attributeName + '.' + (containsSt && containsNormal ? 'z' : 'y') + ');\n';
            }
        }

        var modifiedVS = vertexShaderSource;
        modifiedVS = modifiedVS.replace(/attribute\s+vec3\s+normal;/g, '');
        modifiedVS = modifiedVS.replace(/attribute\s+vec2\s+st;/g, '');
        modifiedVS = modifiedVS.replace(/attribute\s+vec3\s+tangent;/g, '');
        modifiedVS = modifiedVS.replace(/attribute\s+vec3\s+bitangent;/g, '');
        modifiedVS = ShaderSource.replaceMain(modifiedVS, 'czm_non_compressed_main');
        var compressedMain =
            'void main() \n' +
            '{ \n' +
            decode +
            '    czm_non_compressed_main(); \n' +
            '}';

        return [attributeDecl, globalDecl, modifiedVS, compressedMain].join('\n');
    }

    function depthClampVS(vertexShaderSource) {
        var modifiedVS = ShaderSource.replaceMain(vertexShaderSource, 'czm_non_depth_clamp_main');
        // The varying should be surround by #ifdef GL_EXT_frag_depth as an optimization.
        // It is not to workaround an issue with Edge:
        //     https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/12120362/
        modifiedVS +=
            'varying float v_WindowZ;\n' +
            'void main() {\n' +
            '    czm_non_depth_clamp_main();\n' +
            '    vec4 position = gl_Position;\n' +
            '    v_WindowZ = (0.5 * (position.z / position.w) + 0.5) * position.w;\n' +
            '    position.z = min(position.z, position.w);\n' +
            '    gl_Position = position;\n' +
            '}\n';
        return modifiedVS;
    }

    function depthClampFS(fragmentShaderSource) {
        var modifiedFS = ShaderSource.replaceMain(fragmentShaderSource, 'czm_non_depth_clamp_main');
        modifiedFS +=
            'varying float v_WindowZ;\n' +
            'void main() {\n' +
            '    czm_non_depth_clamp_main();\n' +
            '#if defined(GL_EXT_frag_depth) && !defined(LOG_DEPTH)\n' +
            '    gl_FragDepthEXT = min(v_WindowZ * gl_FragCoord.w, 1.0);\n' +
            '#endif\n' +
            '}\n';
        modifiedFS =
            '#ifdef GL_EXT_frag_depth\n' +
            '#extension GL_EXT_frag_depth : enable\n' +
            '#endif\n' +
            modifiedFS;
        return modifiedFS;
    }

    function validateShaderMatching(shaderProgram, attributeLocations) {
        // For a VAO and shader program to be compatible, the VAO must have
        // all active attribute in the shader program.  The VAO may have
        // extra attributes with the only concern being a potential
        // performance hit due to extra memory bandwidth and cache pollution.
        // The shader source could have extra attributes that are not used,
        // but there is no guarantee they will be optimized out.
        //
        // Here, we validate that the VAO has all attributes required
        // to match the shader program.
        var shaderAttributes = shaderProgram.vertexAttributes;

        //>>includeStart('debug', pragmas.debug);
        for (var name in shaderAttributes) {
            if (shaderAttributes.hasOwnProperty(name)) {
                if (!defined(attributeLocations[name])) {
                    throw new DeveloperError('Appearance/Geometry mismatch.  The appearance requires vertex shader attribute input \'' + name +
                                             '\', which was not computed as part of the Geometry.  Use the appearance\'s vertexFormat property when constructing the geometry.');
                }
            }
        }
        //>>includeEnd('debug');
    }

    function getUniformFunction(uniforms, name) {
        return function() {
            return uniforms[name];
        };
    }

    var numberOfCreationWorkers = Math.max(FeatureDetection.hardwareConcurrency - 1, 1);
    var createGeometryTaskProcessors;
    var combineGeometryTaskProcessor = new TaskProcessor('combineGeometry', Number.POSITIVE_INFINITY);

    function loadAsynchronous(primitive, frameState) {
        var instances;
        var geometry;
        var i;
        var j;

        var instanceIds = primitive._instanceIds;

        if (primitive._state === PrimitiveState.READY) {
            instances = (isArray(primitive.geometryInstances)) ? primitive.geometryInstances : [primitive.geometryInstances];
            var length = primitive._numberOfInstances = instances.length;

            var promises = [];
            var subTasks = [];
            for (i = 0; i < length; ++i) {
                geometry = instances[i].geometry;
                instanceIds.push(instances[i].id);

                //>>includeStart('debug', pragmas.debug);
                if (!defined(geometry._workerName)) {
                    throw new DeveloperError('_workerName must be defined for asynchronous geometry.');
                }
                //>>includeEnd('debug');

                subTasks.push({
                    moduleName : geometry._workerName,
                    geometry : geometry
                });
            }

            if (!defined(createGeometryTaskProcessors)) {
                createGeometryTaskProcessors = new Array(numberOfCreationWorkers);
                for (i = 0; i < numberOfCreationWorkers; i++) {
                    createGeometryTaskProcessors[i] = new TaskProcessor('createGeometry', Number.POSITIVE_INFINITY);
                }
            }

            var subTask;
            subTasks = subdivideArray(subTasks, numberOfCreationWorkers);

            for (i = 0; i < subTasks.length; i++) {
                var packedLength = 0;
                var workerSubTasks = subTasks[i];
                var workerSubTasksLength = workerSubTasks.length;
                for (j = 0; j < workerSubTasksLength; ++j) {
                    subTask = workerSubTasks[j];
                    geometry = subTask.geometry;
                    if (defined(geometry.constructor.pack)) {
                        subTask.offset = packedLength;
                        packedLength += defaultValue(geometry.constructor.packedLength, geometry.packedLength);
                    }
                }

                var subTaskTransferableObjects;

                if (packedLength > 0) {
                    var array = new Float64Array(packedLength);
                    subTaskTransferableObjects = [array.buffer];

                    for (j = 0; j < workerSubTasksLength; ++j) {
                        subTask = workerSubTasks[j];
                        geometry = subTask.geometry;
                        if (defined(geometry.constructor.pack)) {
                            geometry.constructor.pack(geometry, array, subTask.offset);
                            subTask.geometry = array;
                        }
                    }
                }

                promises.push(createGeometryTaskProcessors[i].scheduleTask({
                    subTasks : subTasks[i]
                }, subTaskTransferableObjects));
            }

            primitive._state = PrimitiveState.CREATING;

            when.all(promises, function(results) {
                primitive._createGeometryResults = results;
                primitive._state = PrimitiveState.CREATED;
            }).otherwise(function(error) {
                setReady(primitive, frameState, PrimitiveState.FAILED, error);
            });
        } else if (primitive._state === PrimitiveState.CREATED) {
            var transferableObjects = [];
            instances = (isArray(primitive.geometryInstances)) ? primitive.geometryInstances : [primitive.geometryInstances];

            var scene3DOnly = frameState.scene3DOnly;
            var projection = frameState.mapProjection;

            var promise = combineGeometryTaskProcessor.scheduleTask(PrimitivePipeline.packCombineGeometryParameters({
                createGeometryResults : primitive._createGeometryResults,
                instances : instances,
                ellipsoid : projection.ellipsoid,
                projection : projection,
                elementIndexUintSupported : frameState.context.elementIndexUint,
                scene3DOnly : scene3DOnly,
                vertexCacheOptimize : primitive.vertexCacheOptimize,
                compressVertices : primitive.compressVertices,
                modelMatrix : primitive.modelMatrix,
                createPickOffsets : primitive._createPickOffsets
            }, transferableObjects), transferableObjects);

            primitive._createGeometryResults = undefined;
            primitive._state = PrimitiveState.COMBINING;

            when(promise, function(packedResult) {
                var result = PrimitivePipeline.unpackCombineGeometryResults(packedResult);
                primitive._geometries = result.geometries;
                primitive._attributeLocations = result.attributeLocations;
                primitive.modelMatrix = Matrix4.clone(result.modelMatrix, primitive.modelMatrix);
                primitive._pickOffsets = result.pickOffsets;
                primitive._offsetInstanceExtend = result.offsetInstanceExtend;
                primitive._instanceBoundingSpheres = result.boundingSpheres;
                primitive._instanceBoundingSpheresCV = result.boundingSpheresCV;

                if (defined(primitive._geometries) && primitive._geometries.length > 0) {
                    primitive._recomputeBoundingSpheres = true;
                    primitive._state = PrimitiveState.COMBINED;
                } else {
                    setReady(primitive, frameState, PrimitiveState.FAILED, undefined);
                }
            }).otherwise(function(error) {
                setReady(primitive, frameState, PrimitiveState.FAILED, error);
            });
        }
    }

    function loadSynchronous(primitive, frameState) {
        var instances = (isArray(primitive.geometryInstances)) ? primitive.geometryInstances : [primitive.geometryInstances];
        var length = primitive._numberOfInstances = instances.length;
        var clonedInstances = new Array(length);
        var instanceIds = primitive._instanceIds;

        var instance;
        var i;

        var geometryIndex = 0;
        for (i = 0; i < length; i++) {
            instance = instances[i];
            var geometry = instance.geometry;

            var createdGeometry;
            if (defined(geometry.attributes) && defined(geometry.primitiveType)) {
                createdGeometry = cloneGeometry(geometry);
            } else {
                createdGeometry = geometry.constructor.createGeometry(geometry);
            }

            clonedInstances[geometryIndex++] = cloneInstance(instance, createdGeometry);
            instanceIds.push(instance.id);
        }

        clonedInstances.length = geometryIndex;

        var scene3DOnly = frameState.scene3DOnly;
        var projection = frameState.mapProjection;

        var result = PrimitivePipeline.combineGeometry({
            instances : clonedInstances,
            ellipsoid : projection.ellipsoid,
            projection : projection,
            elementIndexUintSupported : frameState.context.elementIndexUint,
            scene3DOnly : scene3DOnly,
            vertexCacheOptimize : primitive.vertexCacheOptimize,
            compressVertices : primitive.compressVertices,
            modelMatrix : primitive.modelMatrix,
            createPickOffsets : primitive._createPickOffsets
        });

        primitive._geometries = result.geometries;
        primitive._attributeLocations = result.attributeLocations;
        primitive.modelMatrix = Matrix4.clone(result.modelMatrix, primitive.modelMatrix);
        primitive._pickOffsets = result.pickOffsets;
        primitive._offsetInstanceExtend = result.offsetInstanceExtend;
        primitive._instanceBoundingSpheres = result.boundingSpheres;
        primitive._instanceBoundingSpheresCV = result.boundingSpheresCV;

        if (defined(primitive._geometries) && primitive._geometries.length > 0) {
            primitive._recomputeBoundingSpheres = true;
            primitive._state = PrimitiveState.COMBINED;
        } else {
            setReady(primitive, frameState, PrimitiveState.FAILED, undefined);
        }
    }

    function recomputeBoundingSpheres(primitive, frameState) {
        var offsetIndex = primitive._batchTableAttributeIndices.offset;
        if (!primitive._recomputeBoundingSpheres || !defined(offsetIndex)) {
            primitive._recomputeBoundingSpheres = false;
            return;
        }

        var i;
        var offsetInstanceExtend = primitive._offsetInstanceExtend;
        var boundingSpheres = primitive._instanceBoundingSpheres;
        var length = boundingSpheres.length;
        var newBoundingSpheres = primitive._tempBoundingSpheres;
        if (!defined(newBoundingSpheres)) {
            newBoundingSpheres = new Array(length);
            for (i = 0; i < length; i++) {
                newBoundingSpheres[i] = new BoundingSphere();
            }
            primitive._tempBoundingSpheres = newBoundingSpheres;
        }
        for (i = 0; i < length; ++i) {
            var newBS = newBoundingSpheres[i];
            var offset = primitive._batchTable.getBatchedAttribute(i, offsetIndex, new Cartesian3());
            newBS = boundingSpheres[i].clone(newBS);
            transformBoundingSphere(newBS, offset, offsetInstanceExtend[i]);
        }
        var combinedBS = [];
        var combinedWestBS = [];
        var combinedEastBS = [];

        for (i = 0; i < length; ++i) {
            var bs = newBoundingSpheres[i];

            var minX = bs.center.x - bs.radius;
            if (minX > 0 || BoundingSphere.intersectPlane(bs, Plane.ORIGIN_ZX_PLANE) !== Intersect.INTERSECTING) {
                combinedBS.push(bs);
            } else {
                combinedWestBS.push(bs);
                combinedEastBS.push(bs);
            }
        }

        var resultBS1 = combinedBS[0];
        var resultBS2 = combinedEastBS[0];
        var resultBS3 = combinedWestBS[0];

        for (i = 1; i < combinedBS.length; i++) {
            resultBS1 = BoundingSphere.union(resultBS1, combinedBS[i]);
        }
        for (i = 1; i < combinedEastBS.length; i++) {
            resultBS2 = BoundingSphere.union(resultBS2, combinedEastBS[i]);
        }
        for (i = 1; i < combinedWestBS.length; i++) {
            resultBS3 = BoundingSphere.union(resultBS3, combinedWestBS[i]);
        }
        var result = [];
        if (defined(resultBS1)) {
            result.push(resultBS1);
        }
        if (defined(resultBS2)) {
            result.push(resultBS2);
        }
        if (defined(resultBS3)) {
            result.push(resultBS3);
        }

        for (i = 0; i < result.length; i++) {
            var boundingSphere = result[i].clone(primitive._boundingSpheres[i]);
            primitive._boundingSpheres[i] = boundingSphere;
            primitive._boundingSphereCV[i] = BoundingSphere.projectTo2D(boundingSphere, frameState.mapProjection, primitive._boundingSphereCV[i]);
        }

        Primitive._updateBoundingVolumes(primitive, frameState, primitive.modelMatrix, true);
        primitive._recomputeBoundingSpheres = false;
    }

    var scratchBoundingSphereCenterEncoded = new EncodedCartesian3();
    var scratchBoundingSphereCartographic = new Cartographic();
    var scratchBoundingSphereCenter2D = new Cartesian3();
    var scratchBoundingSphere = new BoundingSphere();

    function updateBatchTableBoundingSpheres(primitive, frameState) {
        var hasDistanceDisplayCondition = defined(primitive._batchTableAttributeIndices.distanceDisplayCondition);
        if (!hasDistanceDisplayCondition || primitive._batchTableBoundingSpheresUpdated) {
            return;
        }

        var indices = primitive._batchTableBoundingSphereAttributeIndices;
        var center3DHighIndex = indices.center3DHigh;
        var center3DLowIndex = indices.center3DLow;
        var center2DHighIndex = indices.center2DHigh;
        var center2DLowIndex = indices.center2DLow;
        var radiusIndex = indices.radius;

        var projection = frameState.mapProjection;
        var ellipsoid = projection.ellipsoid;

        var batchTable = primitive._batchTable;
        var boundingSpheres = primitive._instanceBoundingSpheres;
        var length = boundingSpheres.length;

        for (var i = 0; i < length; ++i) {
            var boundingSphere = boundingSpheres[i];
            if (!defined(boundingSphere)) {
                continue;
            }

            var modelMatrix = primitive.modelMatrix;
            if (defined(modelMatrix)) {
                boundingSphere = BoundingSphere.transform(boundingSphere, modelMatrix, scratchBoundingSphere);
            }

            var center = boundingSphere.center;
            var radius = boundingSphere.radius;

            var encodedCenter = EncodedCartesian3.fromCartesian(center, scratchBoundingSphereCenterEncoded);
            batchTable.setBatchedAttribute(i, center3DHighIndex, encodedCenter.high);
            batchTable.setBatchedAttribute(i, center3DLowIndex, encodedCenter.low);

            if (!frameState.scene3DOnly) {
                var cartographic = ellipsoid.cartesianToCartographic(center, scratchBoundingSphereCartographic);
                var center2D = projection.project(cartographic, scratchBoundingSphereCenter2D);
                encodedCenter = EncodedCartesian3.fromCartesian(center2D, scratchBoundingSphereCenterEncoded);
                batchTable.setBatchedAttribute(i, center2DHighIndex, encodedCenter.high);
                batchTable.setBatchedAttribute(i, center2DLowIndex, encodedCenter.low);
            }

            batchTable.setBatchedAttribute(i, radiusIndex, radius);
        }

        primitive._batchTableBoundingSpheresUpdated = true;
    }

    var offsetScratchCartesian = new Cartesian3();
    var offsetCenterScratch = new Cartesian3();
    function updateBatchTableOffsets(primitive, frameState) {
        var hasOffset = defined(primitive._batchTableAttributeIndices.offset);
        if (!hasOffset || primitive._batchTableOffsetsUpdated || frameState.scene3DOnly) {
            return;
        }

        var index2D = primitive._batchTableOffsetAttribute2DIndex;

        var projection = frameState.mapProjection;
        var ellipsoid = projection.ellipsoid;

        var batchTable = primitive._batchTable;
        var boundingSpheres = primitive._instanceBoundingSpheres;
        var length = boundingSpheres.length;

        for (var i = 0; i < length; ++i) {
            var boundingSphere = boundingSpheres[i];
            if (!defined(boundingSphere)) {
                continue;
            }
            var offset = batchTable.getBatchedAttribute(i, primitive._batchTableAttributeIndices.offset);
            if (Cartesian3.equals(offset, Cartesian3.ZERO)) {
                batchTable.setBatchedAttribute(i, index2D, Cartesian3.ZERO);
                continue;
            }

            var modelMatrix = primitive.modelMatrix;
            if (defined(modelMatrix)) {
                boundingSphere = BoundingSphere.transform(boundingSphere, modelMatrix, scratchBoundingSphere);
            }

            var center = boundingSphere.center;
            center = ellipsoid.scaleToGeodeticSurface(center, offsetCenterScratch);
            var cartographic = ellipsoid.cartesianToCartographic(center, scratchBoundingSphereCartographic);
            var center2D = projection.project(cartographic, scratchBoundingSphereCenter2D);

            var newPoint = Cartesian3.add(offset, center, offsetScratchCartesian);
            cartographic = ellipsoid.cartesianToCartographic(newPoint, cartographic);

            var newPointProjected = projection.project(cartographic, offsetScratchCartesian);

            var newVector = Cartesian3.subtract(newPointProjected, center2D, offsetScratchCartesian);

            var x = newVector.x;
            newVector.x = newVector.z;
            newVector.z = newVector.y;
            newVector.y = x;

            batchTable.setBatchedAttribute(i, index2D, newVector);
        }

        primitive._batchTableOffsetsUpdated = true;
    }

    function createVertexArray(primitive, frameState) {
        var attributeLocations = primitive._attributeLocations;
        var geometries = primitive._geometries;
        var scene3DOnly = frameState.scene3DOnly;
        var context = frameState.context;

        var va = [];
        var length = geometries.length;
        for (var i = 0; i < length; ++i) {
            var geometry = geometries[i];

            va.push(VertexArray.fromGeometry({
                context : context,
                geometry : geometry,
                attributeLocations : attributeLocations,
                bufferUsage : BufferUsage.STATIC_DRAW,
                interleave : primitive._interleave
            }));

            if (defined(primitive._createBoundingVolumeFunction)) {
                primitive._createBoundingVolumeFunction(frameState, geometry);
            } else {
                primitive._boundingSpheres.push(BoundingSphere.clone(geometry.boundingSphere));
                primitive._boundingSphereWC.push(new BoundingSphere());

                if (!scene3DOnly) {
                    var center = geometry.boundingSphereCV.center;
                    var x = center.x;
                    var y = center.y;
                    var z = center.z;
                    center.x = z;
                    center.y = x;
                    center.z = y;

                    primitive._boundingSphereCV.push(BoundingSphere.clone(geometry.boundingSphereCV));
                    primitive._boundingSphere2D.push(new BoundingSphere());
                    primitive._boundingSphereMorph.push(new BoundingSphere());
                }
            }
        }

        primitive._va = va;
        primitive._primitiveType = geometries[0].primitiveType;

        if (primitive.releaseGeometryInstances) {
            primitive.geometryInstances = undefined;
        }

        primitive._geometries = undefined;
        setReady(primitive, frameState, PrimitiveState.COMPLETE, undefined);
    }

    function createRenderStates(primitive, context, appearance, twoPasses) {
        var renderState = appearance.getRenderState();
        var rs;

        if (twoPasses) {
            rs = clone(renderState, false);
            rs.cull = {
                enabled : true,
                face : CullFace.BACK
            };
            primitive._frontFaceRS = RenderState.fromCache(rs);

            rs.cull.face = CullFace.FRONT;
            primitive._backFaceRS = RenderState.fromCache(rs);
        } else {
            primitive._frontFaceRS = RenderState.fromCache(renderState);
            primitive._backFaceRS = primitive._frontFaceRS;
        }

        rs = clone(renderState, false);
        if (defined(primitive._depthFailAppearance)) {
            rs.depthTest.enabled = false;
        }

        if (defined(primitive._depthFailAppearance)) {
            renderState = primitive._depthFailAppearance.getRenderState();
            rs = clone(renderState, false);
            rs.depthTest.func = DepthFunction.GREATER;
            if (twoPasses) {
                rs.cull = {
                    enabled : true,
                    face : CullFace.BACK
                };
                primitive._frontFaceDepthFailRS = RenderState.fromCache(rs);

                rs.cull.face = CullFace.FRONT;
                primitive._backFaceDepthFailRS = RenderState.fromCache(rs);
            } else {
                primitive._frontFaceDepthFailRS = RenderState.fromCache(rs);
                primitive._backFaceDepthFailRS = primitive._frontFaceRS;
            }
        }
    }

    function createShaderProgram(primitive, frameState, appearance) {
        var context = frameState.context;

        var attributeLocations = primitive._attributeLocations;

        var vs = primitive._batchTable.getVertexShaderCallback()(appearance.vertexShaderSource);
        vs = Primitive._appendOffsetToShader(primitive, vs);
        vs = Primitive._appendShowToShader(primitive, vs);
        vs = Primitive._appendDistanceDisplayConditionToShader(primitive, vs, frameState.scene3DOnly);
        vs = appendPickToVertexShader(vs);
        vs = Primitive._updateColorAttribute(primitive, vs, false);
        vs = modifyForEncodedNormals(primitive, vs);
        vs = Primitive._modifyShaderPosition(primitive, vs, frameState.scene3DOnly);
        var fs = appearance.getFragmentShaderSource();
        fs = appendPickToFragmentShader(fs);

        primitive._sp = ShaderProgram.replaceCache({
            context : context,
            shaderProgram : primitive._sp,
            vertexShaderSource : vs,
            fragmentShaderSource : fs,
            attributeLocations : attributeLocations
        });
        validateShaderMatching(primitive._sp, attributeLocations);

        if (defined(primitive._depthFailAppearance)) {
            vs = primitive._batchTable.getVertexShaderCallback()(primitive._depthFailAppearance.vertexShaderSource);
            vs = Primitive._appendShowToShader(primitive, vs);
            vs = Primitive._appendDistanceDisplayConditionToShader(primitive, vs, frameState.scene3DOnly);
            vs = appendPickToVertexShader(vs);
            vs = Primitive._updateColorAttribute(primitive, vs, true);
            vs = modifyForEncodedNormals(primitive, vs);
            vs = Primitive._modifyShaderPosition(primitive, vs, frameState.scene3DOnly);
            vs = depthClampVS(vs);

            fs = primitive._depthFailAppearance.getFragmentShaderSource();
            fs = appendPickToFragmentShader(fs);
            fs = depthClampFS(fs);

            primitive._spDepthFail = ShaderProgram.replaceCache({
                context : context,
                shaderProgram : primitive._spDepthFail,
                vertexShaderSource : vs,
                fragmentShaderSource : fs,
                attributeLocations : attributeLocations
            });
            validateShaderMatching(primitive._spDepthFail, attributeLocations);
        }
    }

    var modifiedModelViewScratch = new Matrix4();
    var rtcScratch = new Cartesian3();

    function getUniforms(primitive, appearance, material, frameState) {
        // Create uniform map by combining uniforms from the appearance and material if either have uniforms.
        var materialUniformMap = defined(material) ? material._uniforms : undefined;
        var appearanceUniformMap = {};
        var appearanceUniforms = appearance.uniforms;
        if (defined(appearanceUniforms)) {
            // Convert to uniform map of functions for the renderer
            for (var name in appearanceUniforms) {
                if (appearanceUniforms.hasOwnProperty(name)) {
                    //>>includeStart('debug', pragmas.debug);
                    if (defined(materialUniformMap) && defined(materialUniformMap[name])) {
                        // Later, we could rename uniforms behind-the-scenes if needed.
                        throw new DeveloperError('Appearance and material have a uniform with the same name: ' + name);
                    }
                    //>>includeEnd('debug');

                    appearanceUniformMap[name] = getUniformFunction(appearanceUniforms, name);
                }
            }
        }
        var uniforms = combine(appearanceUniformMap, materialUniformMap);
        uniforms = primitive._batchTable.getUniformMapCallback()(uniforms);

        if (defined(primitive.rtcCenter)) {
            uniforms.u_modifiedModelView = function() {
                var viewMatrix = frameState.context.uniformState.view;
                Matrix4.multiply(viewMatrix, primitive._modelMatrix, modifiedModelViewScratch);
                Matrix4.multiplyByPoint(modifiedModelViewScratch, primitive.rtcCenter, rtcScratch);
                Matrix4.setTranslation(modifiedModelViewScratch, rtcScratch, modifiedModelViewScratch);
                return modifiedModelViewScratch;
            };
        }

        return uniforms;
    }

    function createCommands(primitive, appearance, material, translucent, twoPasses, colorCommands, pickCommands, frameState) {
        var uniforms = getUniforms(primitive, appearance, material, frameState);

        var depthFailUniforms;
        if (defined(primitive._depthFailAppearance)) {
            depthFailUniforms = getUniforms(primitive, primitive._depthFailAppearance, primitive._depthFailAppearance.material, frameState);
        }

        var pass = translucent ? Pass.TRANSLUCENT : Pass.OPAQUE;

        var multiplier = twoPasses ? 2 : 1;
        multiplier *= defined(primitive._depthFailAppearance) ? 2 : 1;
        colorCommands.length = primitive._va.length * multiplier;

        var length = colorCommands.length;
        var vaIndex = 0;
        for (var i = 0; i < length; ++i) {
            var colorCommand;

            if (twoPasses) {
                colorCommand = colorCommands[i];
                if (!defined(colorCommand)) {
                    colorCommand = colorCommands[i] = new DrawCommand({
                        owner : primitive,
                        primitiveType : primitive._primitiveType
                    });
                }
                colorCommand.vertexArray = primitive._va[vaIndex];
                colorCommand.renderState = primitive._backFaceRS;
                colorCommand.shaderProgram = primitive._sp;
                colorCommand.uniformMap = uniforms;
                colorCommand.pass = pass;

                ++i;
            }

            colorCommand = colorCommands[i];
            if (!defined(colorCommand)) {
                colorCommand = colorCommands[i] = new DrawCommand({
                    owner : primitive,
                    primitiveType : primitive._primitiveType
                });
            }
            colorCommand.vertexArray = primitive._va[vaIndex];
            colorCommand.renderState = primitive._frontFaceRS;
            colorCommand.shaderProgram = primitive._sp;
            colorCommand.uniformMap = uniforms;
            colorCommand.pass = pass;

            if (defined(primitive._depthFailAppearance)) {
                if (twoPasses) {
                    ++i;

                    colorCommand = colorCommands[i];
                    if (!defined(colorCommand)) {
                        colorCommand = colorCommands[i] = new DrawCommand({
                            owner : primitive,
                            primitiveType : primitive._primitiveType
                        });
                    }
                    colorCommand.vertexArray = primitive._va[vaIndex];
                    colorCommand.renderState = primitive._backFaceDepthFailRS;
                    colorCommand.shaderProgram = primitive._spDepthFail;
                    colorCommand.uniformMap = depthFailUniforms;
                    colorCommand.pass = pass;
                }

                ++i;

                colorCommand = colorCommands[i];
                if (!defined(colorCommand)) {
                    colorCommand = colorCommands[i] = new DrawCommand({
                        owner : primitive,
                        primitiveType : primitive._primitiveType
                    });
                }
                colorCommand.vertexArray = primitive._va[vaIndex];
                colorCommand.renderState = primitive._frontFaceDepthFailRS;
                colorCommand.shaderProgram = primitive._spDepthFail;
                colorCommand.uniformMap = depthFailUniforms;
                colorCommand.pass = pass;
            }

            ++vaIndex;
        }
    }

    Primitive._updateBoundingVolumes = function(primitive, frameState, modelMatrix, forceUpdate) {
        var i;
        var length;
        var boundingSphere;

        if (forceUpdate || !Matrix4.equals(modelMatrix, primitive._modelMatrix)) {
            Matrix4.clone(modelMatrix, primitive._modelMatrix);
            length = primitive._boundingSpheres.length;
            for (i = 0; i < length; ++i) {
                boundingSphere = primitive._boundingSpheres[i];
                if (defined(boundingSphere)) {
                    primitive._boundingSphereWC[i] = BoundingSphere.transform(boundingSphere, modelMatrix, primitive._boundingSphereWC[i]);
                    if (!frameState.scene3DOnly) {
                        primitive._boundingSphere2D[i] = BoundingSphere.clone(primitive._boundingSphereCV[i], primitive._boundingSphere2D[i]);
                        primitive._boundingSphere2D[i].center.x = 0.0;
                        primitive._boundingSphereMorph[i] = BoundingSphere.union(primitive._boundingSphereWC[i], primitive._boundingSphereCV[i]);
                    }
                }
            }
        }

        // Update bounding volumes for primitives that are sized in pixels.
        // The pixel size in meters varies based on the distance from the camera.
        var pixelSize = primitive.appearance.pixelSize;
        if (defined(pixelSize)) {
            length = primitive._boundingSpheres.length;
            for (i = 0; i < length; ++i) {
                boundingSphere = primitive._boundingSpheres[i];
                var boundingSphereWC = primitive._boundingSphereWC[i];
                var pixelSizeInMeters = frameState.camera.getPixelSize(boundingSphere, frameState.context.drawingBufferWidth, frameState.context.drawingBufferHeight);
                var sizeInMeters = pixelSizeInMeters * pixelSize;
                boundingSphereWC.radius = boundingSphere.radius + sizeInMeters;
            }
        }
    };

    /**
     * 更新绘制命令
     * @param {} primitive
     * @param {*} frameState
     * @param {*} colorCommands
     * @param {*} pickCommands
     * @param {*} modelMatrix
     * @param {*} cull
     * @param {*} debugShowBoundingVolume
     * @param {*} twoPasses
     */
    function updateAndQueueCommands(primitive, frameState, colorCommands, pickCommands, modelMatrix, cull, debugShowBoundingVolume, twoPasses) {
        //>>includeStart('debug', pragmas.debug);
        if (frameState.mode !== SceneMode.SCENE3D && !Matrix4.equals(modelMatrix, Matrix4.IDENTITY)) {
            throw new DeveloperError('Primitive.modelMatrix is only supported in 3D mode.');
        }
        //>>includeEnd('debug');

        Primitive._updateBoundingVolumes(primitive, frameState, modelMatrix);

        var boundingSpheres;
        if (frameState.mode === SceneMode.SCENE3D) {
            boundingSpheres = primitive._boundingSphereWC;
        } else if (frameState.mode === SceneMode.COLUMBUS_VIEW) {
            boundingSpheres = primitive._boundingSphereCV;
        } else if (frameState.mode === SceneMode.SCENE2D && defined(primitive._boundingSphere2D)) {
            boundingSpheres = primitive._boundingSphere2D;
        } else if (defined(primitive._boundingSphereMorph)) {
            boundingSpheres = primitive._boundingSphereMorph;
        }

        // 渲染队列
        var commandList = frameState.commandList;
        var passes = frameState.passes;
        if (passes.render || passes.pick) {
            var allowPicking = primitive.allowPicking;
            var castShadows = ShadowMode.castShadows(primitive.shadows);
            var receiveShadows = ShadowMode.receiveShadows(primitive.shadows);
            var colorLength = colorCommands.length;

            var factor = twoPasses ? 2 : 1;
            factor *= defined(primitive._depthFailAppearance) ? 2 : 1;

            for (var j = 0; j < colorLength; ++j) {
                var sphereIndex = Math.floor(j / factor);
                var colorCommand = colorCommands[j];
                colorCommand.modelMatrix = modelMatrix;
                colorCommand.boundingVolume = boundingSpheres[sphereIndex];
                colorCommand.cull = cull;
                colorCommand.debugShowBoundingVolume = debugShowBoundingVolume;
                colorCommand.castShadows = castShadows;
                colorCommand.receiveShadows = receiveShadows;

                if (allowPicking) {
                    colorCommand.pickId = 'v_pickColor';
                } else {
                    colorCommand.pickId = undefined;
                }

                commandList.push(colorCommand);
            }
        }
    }

    /**
     * Called when {@link Viewer} or {@link CesiumWidget} render the scene to
     * get the draw commands needed to render this primitive.
     * <p>
     * Do not call this function directly.  This is documented just to
     * list the exceptions that may be propagated when the scene is rendered:
     * </p>
     *
     * @exception {DeveloperError} All instance geometries must have the same primitiveType.
     * @exception {DeveloperError} Appearance and material have a uniform with the same name.
     * @exception {DeveloperError} Primitive.modelMatrix is only supported in 3D mode.
     * @exception {RuntimeError} Vertex texture fetch support is required to render primitives with per-instance attributes. The maximum number of vertex texture image units must be greater than zero.
     */
    Primitive.prototype.update = function(frameState) {
        if (((!defined(this.geometryInstances)) && (this._va.length === 0)) ||
            (defined(this.geometryInstances) && isArray(this.geometryInstances) && this.geometryInstances.length === 0) ||
            (!defined(this.appearance)) ||
            (frameState.mode !== SceneMode.SCENE3D && frameState.scene3DOnly) ||
            (!frameState.passes.render && !frameState.passes.pick)) {
            return;
        }

        if (defined(this._error)) {
            throw this._error;
        }

        //>>includeStart('debug', pragmas.debug);
        if (defined(this.rtcCenter) && !frameState.scene3DOnly) {
            throw new DeveloperError('RTC rendering is only available for 3D only scenes.');
        }
        //>>includeEnd('debug');

        if (this._state === PrimitiveState.FAILED) {
            return;
        }

        var context = frameState.context;
        if (!defined(this._batchTable)) {
            createBatchTable(this, context);
        }
        if (this._batchTable.attributes.length > 0) {
            if (ContextLimits.maximumVertexTextureImageUnits === 0) {
                throw new RuntimeError('Vertex texture fetch support is required to render primitives with per-instance attributes. The maximum number of vertex texture image units must be greater than zero.');
            }
            this._batchTable.update(frameState);
        }

        if (this._state !== PrimitiveState.COMPLETE && this._state !== PrimitiveState.COMBINED) {
            if (this.asynchronous) {
                loadAsynchronous(this, frameState);
            } else {
                loadSynchronous(this, frameState);
            }
        }

        if (this._state === PrimitiveState.COMBINED) {
            updateBatchTableBoundingSpheres(this, frameState);
            updateBatchTableOffsets(this, frameState);
            createVertexArray(this, frameState);
        }

        if (!this.show || this._state !== PrimitiveState.COMPLETE) {
            return;
        }

        if (!this._batchTableOffsetsUpdated) {
            updateBatchTableOffsets(this, frameState);
        }
        if (this._recomputeBoundingSpheres) {
            recomputeBoundingSpheres(this, frameState);
        }

        // Create or recreate render state and shader program if appearance/material changed
        var appearance = this.appearance;
        var material = appearance.material;
        var createRS = false;
        var createSP = false;

        if (this._appearance !== appearance) {
            this._appearance = appearance;
            this._material = material;
            createRS = true;
            createSP = true;
        } else if (this._material !== material) {
            this._material = material;
            createSP = true;
        }

        var depthFailAppearance = this.depthFailAppearance;
        var depthFailMaterial = defined(depthFailAppearance) ? depthFailAppearance.material : undefined;

        if (this._depthFailAppearance !== depthFailAppearance) {
            this._depthFailAppearance = depthFailAppearance;
            this._depthFailMaterial = depthFailMaterial;
            createRS = true;
            createSP = true;
        } else if (this._depthFailMaterial !== depthFailMaterial) {
            this._depthFailMaterial = depthFailMaterial;
            createSP = true;
        }

        var translucent = this._appearance.isTranslucent();
        if (this._translucent !== translucent) {
            this._translucent = translucent;
            createRS = true;
        }

        if (defined(this._material)) {
            this._material.update(context);
        }

        var twoPasses = appearance.closed && translucent;

        if (createRS) {
            var rsFunc = defaultValue(this._createRenderStatesFunction, createRenderStates);
            rsFunc(this, context, appearance, twoPasses);
        }

        if (createSP) {
            var spFunc = defaultValue(this._createShaderProgramFunction, createShaderProgram);
            spFunc(this, frameState, appearance);
        }

        if (createRS || createSP) {
            var commandFunc = defaultValue(this._createCommandsFunction, createCommands);
            commandFunc(this, appearance, material, translucent, twoPasses, this._colorCommands, this._pickCommands, frameState);
        }

        var updateAndQueueCommandsFunc = defaultValue(this._updateAndQueueCommandsFunction, updateAndQueueCommands);
        updateAndQueueCommandsFunc(this, frameState, this._colorCommands, this._pickCommands, this.modelMatrix, this.cull, this.debugShowBoundingVolume, twoPasses);
    };

    var offsetBoundingSphereScratch1 = new BoundingSphere();
    var offsetBoundingSphereScratch2 = new BoundingSphere();
    function transformBoundingSphere(boundingSphere, offset, offsetAttribute) {
        if (offsetAttribute === GeometryOffsetAttribute.TOP) {
            var origBS = BoundingSphere.clone(boundingSphere, offsetBoundingSphereScratch1);
            var offsetBS = BoundingSphere.clone(boundingSphere, offsetBoundingSphereScratch2);
            offsetBS.center = Cartesian3.add(offsetBS.center, offset, offsetBS.center);
            boundingSphere = BoundingSphere.union(origBS, offsetBS, boundingSphere);
        } else if (offsetAttribute === GeometryOffsetAttribute.ALL) {
            boundingSphere.center = Cartesian3.add(boundingSphere.center, offset, boundingSphere.center);
        }

        return boundingSphere;
    }

    function createGetFunction(batchTable, instanceIndex, attributeIndex) {
        return function() {
            var attributeValue = batchTable.getBatchedAttribute(instanceIndex, attributeIndex);
            var attribute = batchTable.attributes[attributeIndex];
            var componentsPerAttribute = attribute.componentsPerAttribute;
            var value = ComponentDatatype.createTypedArray(attribute.componentDatatype, componentsPerAttribute);
            if (defined(attributeValue.constructor.pack)) {
                attributeValue.constructor.pack(attributeValue, value, 0);
            } else {
                value[0] = attributeValue;
            }
            return value;
        };
    }

    function createSetFunction(batchTable, instanceIndex, attributeIndex, primitive, name) {
        return function(value) {
            //>>includeStart('debug', pragmas.debug);
            if (!defined(value) || !defined(value.length) || value.length < 1 || value.length > 4) {
                throw new DeveloperError('value must be and array with length between 1 and 4.');
            }
            //>>includeEnd('debug');
            var attributeValue = getAttributeValue(value);
            batchTable.setBatchedAttribute(instanceIndex, attributeIndex, attributeValue);
            if (name === 'offset') {
                primitive._recomputeBoundingSpheres = true;
                primitive._batchTableOffsetsUpdated = false;
            }
        };
    }

    var offsetScratch = new Cartesian3();

    function createBoundingSphereProperties(primitive, properties, index) {
        properties.boundingSphere = {
            get : function() {
                var boundingSphere = primitive._instanceBoundingSpheres[index];
                if (defined(boundingSphere)) {
                    boundingSphere = boundingSphere.clone();
                    var modelMatrix = primitive.modelMatrix;
                    var offset = properties.offset;
                    if (defined(offset)) {
                        transformBoundingSphere(boundingSphere, Cartesian3.fromArray(offset.get(), 0, offsetScratch), primitive._offsetInstanceExtend[index]);
                    }
                    if (defined(modelMatrix)) {
                        boundingSphere = BoundingSphere.transform(boundingSphere, modelMatrix);
                    }
                }

                return boundingSphere;
            }
        };
        properties.boundingSphereCV = {
            get : function() {
                return primitive._instanceBoundingSpheresCV[index];
            }
        };
    }

    function createPickIdProperty(primitive, properties, index) {
        properties.pickId = {
            get : function() {
                return primitive._pickIds[index];
            }
        };
    }

    /**
     * Returns the modifiable per-instance attributes for a {@link GeometryInstance}.
     *
     * @param {*} id The id of the {@link GeometryInstance}.
     * @returns {Object} The typed array in the attribute's format or undefined if the is no instance with id.
     *
     * @exception {DeveloperError} must call update before calling getGeometryInstanceAttributes.
     *
     * @example
     * var attributes = primitive.getGeometryInstanceAttributes('an id');
     * attributes.color = Cesium.ColorGeometryInstanceAttribute.toValue(Cesium.Color.AQUA);
     * attributes.show = Cesium.ShowGeometryInstanceAttribute.toValue(true);
     * attributes.distanceDisplayCondition = Cesium.DistanceDisplayConditionGeometryInstanceAttribute.toValue(100.0, 10000.0);
     * attributes.offset = Cesium.OffsetGeometryInstanceAttribute.toValue(Cartesian3.IDENTITY);
     */
    Primitive.prototype.getGeometryInstanceAttributes = function(id) {
        //>>includeStart('debug', pragmas.debug);
        if (!defined(id)) {
            throw new DeveloperError('id is required');
        }
        if (!defined(this._batchTable)) {
            throw new DeveloperError('must call update before calling getGeometryInstanceAttributes');
        }
        //>>includeEnd('debug');

        var index = -1;
        var lastIndex = this._lastPerInstanceAttributeIndex;
        var ids = this._instanceIds;
        var length = ids.length;
        for (var i = 0; i < length; ++i) {
            var curIndex = (lastIndex + i) % length;
            if (id === ids[curIndex]) {
                index = curIndex;
                break;
            }
        }

        if (index === -1) {
            return undefined;
        }

        var attributes = this._perInstanceAttributeCache[index];
        if (defined(attributes)) {
            return attributes;
        }

        var batchTable = this._batchTable;
        var perInstanceAttributeIndices = this._batchTableAttributeIndices;
        attributes = {};
        var properties = {};

        for (var name in perInstanceAttributeIndices) {
            if (perInstanceAttributeIndices.hasOwnProperty(name)) {
                var attributeIndex = perInstanceAttributeIndices[name];
                properties[name] = {
                    get : createGetFunction(batchTable, index, attributeIndex)
                };

                var createSetter = true;
                var readOnlyAttributes = this._readOnlyInstanceAttributes;
                if (createSetter && defined(readOnlyAttributes)) {
                    length = readOnlyAttributes.length;
                    for (var k = 0; k < length; ++k) {
                        if (name === readOnlyAttributes[k]) {
                            createSetter = false;
                            break;
                        }
                    }
                }

                if (createSetter) {
                    properties[name].set = createSetFunction(batchTable, index, attributeIndex, this, name);
                }
            }
        }

        createBoundingSphereProperties(this, properties, index);
        createPickIdProperty(this, properties, index);
        defineProperties(attributes, properties);

        this._lastPerInstanceAttributeIndex = index;
        this._perInstanceAttributeCache[index] = attributes;
        return attributes;
    };

    /**
     * Returns true if this object was destroyed; otherwise, false.
     * <p>
     * If this object was destroyed, it should not be used; calling any function other than
     * <code>isDestroyed</code> will result in a {@link DeveloperError} exception.
     * </p>
     *
     * @returns {Boolean} <code>true</code> if this object was destroyed; otherwise, <code>false</code>.
     *
     * @see Primitive#destroy
     */
    Primitive.prototype.isDestroyed = function() {
        return false;
    };

    /**
     * Destroys the WebGL resources held by this object.  Destroying an object allows for deterministic
     * release of WebGL resources, instead of relying on the garbage collector to destroy this object.
     * <p>
     * Once an object is destroyed, it should not be used; calling any function other than
     * <code>isDestroyed</code> will result in a {@link DeveloperError} exception.  Therefore,
     * assign the return value (<code>undefined</code>) to the object as done in the example.
     * </p>
     *
     * @exception {DeveloperError} This object was destroyed, i.e., destroy() was called.
     *
     *
     * @example
     * e = e && e.destroy();
     *
     * @see Primitive#isDestroyed
     */
    Primitive.prototype.destroy = function() {
        var length;
        var i;

        this._sp = this._sp && this._sp.destroy();
        this._spDepthFail = this._spDepthFail && this._spDepthFail.destroy();

        var va = this._va;
        length = va.length;
        for (i = 0; i < length; ++i) {
            va[i].destroy();
        }
        this._va = undefined;

        var pickIds = this._pickIds;
        length = pickIds.length;
        for (i = 0; i < length; ++i) {
            pickIds[i].destroy();
        }
        this._pickIds = undefined;

        this._batchTable = this._batchTable && this._batchTable.destroy();

        //These objects may be fairly large and reference other large objects (like Entities)
        //We explicitly set them to undefined here so that the memory can be freed
        //even if a reference to the destroyed Primitive has been kept around.
        this._instanceIds = undefined;
        this._perInstanceAttributeCache = undefined;
        this._attributeLocations = undefined;

        return destroyObject(this);
    };

    function setReady(primitive, frameState, state, error) {
        primitive._error = error;
        primitive._state = state;
        frameState.afterRender.push(function() {
            primitive._ready = primitive._state === PrimitiveState.COMPLETE || primitive._state === PrimitiveState.FAILED;
            if (!defined(error)) {
                primitive._readyPromise.resolve(primitive);
            } else {
                primitive._readyPromise.reject(error);
            }
        });
    }
export default Primitive;
