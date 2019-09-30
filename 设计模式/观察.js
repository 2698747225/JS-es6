(function () {

    var root = typeof self === 'object' && self.self === self && self ||
        typeof global === 'object' && global.global === global && global ||
        this || {};

    // 用 root._levi保存之前挂载window上的值，放置_levi重写
    var previousUnderscore = root._levi;

    // 保存字节在压缩版本中
    var ArrayProto = Array.prototype;
    var ObjProto = Object.prototype;
    var symbolProto = typeof Symbol !== 'undefined' ? Symbol.prototype : null;

    // 创建变量 => 引用原型对象上的方法
    var push = ArrayProto.push,
        slice = ArrayProto.slice,
        toString = ArrayProto.toString,
        hasOwnProperty = ObjProto.hasOwnProperty;

    // es5 上的方法
    var nativeIsArray = Array.isArray,
        nativeKeys = Object.keys,
        nativeCreate = Object.create;

    // 后续设置原型会用到
    var Ctor = function () {};

    /** 
     * @description 使用工具库有2种方法
     * 1、_levi(xxx).map
     * 2、_levi.map(xx)
     * */
    var _levi = function (obj) {
        if (obj instanceof _levi) {
            return obj;
        }
        if (!(this instanceof _levi)) { // 面向对象式调用，再把 _levi上的方法 通过levi.minxin() copy  一份到_levi.prototype
            return new _levi(obj);
        }
        this._leviwrapped = obj; // 构造函数实例化的时候，被赋值,即：实例化对象有这_leviwrapped属性值
    }

    // 导出 _levi_levi 对于浏览器对象window._levi即可  nodejs 环境挂载在global
    if (typeof exports !== 'undefined' && !exports.nodeType) {
        if (typeof module !== 'undefined' && !module.nodeType && module.exports) {
            exports = module.exports = _levi;
        }
        exports._levi = _levi;
    } else {
        root._levi = _levi; // 默认放在window上
    }

    _levi.VERSION = 'levi_0.1';

    /**
     * @description  回调函数优化
     * @param context 函数上下文 => this
     * context => 多为传入的对象 => 利用闭包特点获取到
     * void 0 === undefined
     * */
    var optimizeCb = function (func, context, argContent) {
        if (context === void 0) return func;
        switch (argContent === null ? 3 : argContent) {
            case 1:
                return function (value) {
                    return func.call(context, value);
                };
            case 3:
                return function (value, index, collection) {
                    return func.call(context, value, index, collection);
                }
            case 4:
                return function (accumulator, value, index, collection) {
                    return func.call(context, accumulator, value, index, collection);
                }
        }
        return function () {
            return func.apply(context, arguments);
        }
    }

    var builtinIteratee;

    var cb = function (value, context, argCount) {
        if (_levi.iteretee !== builtinIteratee) return _levi.iteretee(value, context);
        if (value === null) return _levi.indentity;
        if (_levi.isFunction(value)) return optimizeCb(value, context, argCount);
        if (_levi.isObject(value) && !_levi.isArray(value)) return _levi.matcher(value);
        return _levi.property(value);
    }

    // Infinity用来存放无穷大的值
    _levi.iteretee = builtinIteratee = function (value, context) {
        return cb(value, context, Infinity);
    }

    /**
     * 函数形参的整理，接受一个开始参数
        restArguments(function (...item) {
            console.log(item);
        }, 3)('aa', 'bb', 'cc', 'dd', 'eee');
        func = function(a,b,c,d) {} => fn.length = 4;  参数的长度
     * */
    var restArguments = function (func, startIndex) {
        startIndex = !startIndex ? func.length - 1 : +startIndex;
        return function () {
            var length = Math.max(arguments.length - startIndex, 0);
            var rest = Array(length);
            index = 0;
            for (index; index < length; index++) {
                rest[index] = arguments[index + startIndex];
            }
            switch (startIndex) {
                case 0:
                    return func.call(this, rest);
                case 1:
                    return func.call(this, arguments[0], rest);
                case 2:
                    return func.call(this, arguments[0], arguments[1], rest);
            }

            var args = Array(startIndex + 1);
            for (index = 0; index < startIndex; index++) {
                args[index] = arguments[index];
            }
            args[startIndex] = rest;
            return func.apply(this, args);
        }
    }

    /** 
     * @description 创建对象指向指向特定的原型
     * Object.create 创建对象方式 https://stackoverflow.com/questions/35816222/object-create-source-explanation
     * 
     * 注意         
     *  Child.prototype = Person.prototype;
        var child = new Child();    // child 仍然指向Person.ProtoType  因为child保存的是 __proto__
        child.name = 'nieshi'
        Child.prototype = null;     // 消除Child原型对象指向
     * 
     * */
    var baseCreate = function (prototype) {
        if (!_levi.isObject(prototype)) return {};
        // 如果支持nativeCreate方法
        if (nativeCreate) return nativeCreate(prototype);
        // 空函数设置原型对象
        Ctor.prototype = prototype;
        var result = new Ctor;
        Ctor.prototype = null;
        return result;
    }

    var shallowProperty = function (key) {
        return function (obj) {
            return !obj ? void 0 : obj[key];
        }
    }

    var has = function (obj, key) {
        return obj && hasOwnProperty.call(obj, key);
    }

    var deepGet = function (obj, path) {
        var length = path.length;
        for (var i = 0; i < length; i++) {
            if (obj === null) return void 0;
            obj = obj[path[i]];
        }
        return length ? obj : void 0;
    }

    var MAX_leviARRAY_leviINDEX = Math.pow(2, 53) - 1;
    var getLength = shallowProperty('length');
    var isArrayLike = function (collection) {
        var length = getLength(collection);
        return typeof length === 'number' && length >= 0 && length <= MAX_leviARRAY_leviINDEX;
    }

    /** 
     * @description 数组/对象Each遍历
     * @param obj 操作对象
     * @param iteretee 回调函数
     * @param context 函数上下文 => this
     * 使用 _levi.each([1, 2, 3], function (item) { xxx }, {})
     * */
    _levi.each = _levi.forEach = function (obj, iteretee, context) {
        iteretee = optimizeCb(iteretee, context);
        var i, length;
        if (isArrayLike(obj)) {
            for (i = 0, length = obj.length; i < length; i++) {
                iteretee(obj[i], i, obj);
            }
        } else {
            var keys = _levi.keys(obj);
            for (i = 0, length = keys.length; i < length; i++) {
                iteretee(obj[keys[i]], keys[i], obj);
            }
        }
        return obj;
    }

    /** 
     * @description 数组和对象遍历 
     * @param obj 操作对象
     * @param iteretee 回调函数
     * @param context 函数上下文 => this
     * keys = !_levi.isArrayLike(obj) && _levi.keys(obj)  增加对象的方法判断
     * 使用 :  levi_.map([1, 2, 3], function (item) { return 222; }, {})
     * */
    _levi.map = _levi.collect = function (obj, iteretee, context) {
        iteretee = cb(iteretee, context); // 回调函数优化
        var keys = !isArrayLike(obj) && _levi.keys(obj),
            length = (keys || obj).length,
            results = Array(length);
        for (var index = 0; index < length; index++) {
            var currentKey = keys ? keys[index] : index;
            results[index] = iteretee(obj[currentKey], currentKey, obj);
        }
        return results;
    }

    /**
     * @description reduce
     * */
    var createReduce = function (dir) {
        var reducer = function (obj, iteratee, memo, initial) {
            var keys = !isArrayLike(obj) && _levi.keys(obj),
                length = (keys || obj).length,
                // dir 1从左开始遍历 index = 0 , dir -1从右开始遍历
                index = dir > 0 ? 0 : length - 1;
            // 是否初始值
            if (!initial) {
                memo = obj[keys ? keys[index] : index];
                index += dir;
            }
            for (; index >= 0 && index < length; index += dir) {
                var currentKey = keys ? keys[index] : index;
                // 循坏调用回调函数
                memo = iteratee(memo, obj[currentKey], currentKey, obj);
            }
            return memo;
        }

        return function (obj, iteratee, memo, context) {
            var initial = arguments.length >= 3; // 赋初始值的时候调用
            // optimizeCb(iteratee, context, 4) 返回一个优化情书，并且回头函数内部用到 context的闭包
            return reducer(obj, optimizeCb(iteratee, context, 4), memo, initial);
        }
    }

    /**
     * @description 查询第一个符合条件的值 
     * @obj 查询对象 arr || object
     * @protecte 回调函数
     * @context 回调函数的上下文
     * */
    _levi.find = _levi.detece = function (obj, predicate, context) {
        var keyFinder = isArrayLike(obj) ? _levi.findIndex : _levi.findKey;
        var key = keyFinder(obj, predicate, context);
        if (key !== void 0 && key !== -1) return obj[key];
    }

    _levi.filter = _levi.select = function (obj, predicate, context) {
        var results = [];
        predicate = cb(predicate, context);
        // 嵌套 _levi.each() 函数来增加判断
        _levi.each(obj, function (value, index, list) {
            if (predicate(value, index, list)) {
                results.push(value);
            }
        });
        return results;
    }

    _levi.reject = function (obj, predicate, context) {
        return _levi.filter(obj, _levi.negate(predicate), context)
    }

    _levi.every = _levi.all = function (obj, predicate, context) {
        predicate = cb(predicate, context);
        var keys = !isArrayLike(obj) && _levi.keys(obj),
            length = (keys || obj).length;
        for (var i = 0; i < length; i++) {
            var currentKey = keys ? keys[index] : index;
            if (!predicate(obj[currentKey], currentKey, obj)) {
                return false;
            }
        }
        return true;
    }

    _levi.some = _levi.any = function (obj, predicate, context) {
        predicate = cb(predicate, context);
        var keys = !isArrayLike(obj) && _levi.keys(obj),
            length = (keys || obj).length;
        for (var index = 0; index < length; i++) {
            var currentKey = keys ? obj[keys[index]] : index;
            if (predicate(obj[currentKey], currentKey, obj)) return true;
        }
        return false;
    }

    // 从左开始reduce
    _levi.reducer = _levi.foldl = _levi.inject = createReduce(1);

    // 从右开始reduce
    _levi_reduceRight = _levi.folder = createReduce(-1);

    // 解决ie < 9 情况下 key不会被for in 循环遍历到问题
    var hasEnumBug = !{
        toString: null
    }.propertyIsEnumerable('toString');
    var nonEnumerableProps = [
        'valueOf', 'isPropertyOf', 'toString',
        'propertyIsEnumerable', 'hasOwnproperty', 'toLocalString'
    ];

    var collectNonEnumProps = function (obj, keys) {
        var nonEnumIdx = nonEnumerableProps.length;
        var constructor = obj.constructor;
        var proto = _levi.isFunction(constructor) && constructor.prototype || ObjProto;

        var prop = 'constructor';
        if (has(obj, prop) && !_levi.contains(keys, prop)) {
            keys.push(prop);
        }

        while (nonEnumIdx--) {
            prop = nonEnumerableProps[nonEnumIdx];
            if (prop in obj && obj[prop] !== proto[prop] && !_levi.contains(keys, prop)) {
                keys.push(prop);
            }
        }
    }

    _levi.contains = _levi.includes = _levi.include = function (obj, item, fromIndex, guard) {
        if (!isArrayLike(obj)) obj = _levi.values(obj);
        if (typeof fromIndex !== 'number' || guard) fromIndex = 0;
        return _levi.indexOf(obj, item, fromIndex) >= 0;
    }

    /**
     * @desc 过滤对象指定的属性 attrs = 过滤条件
     * 返回的是一个数组
     * */
    _levi.where = function (obj, attrs) {
        return _levi.filter(obj, _levi.matcher(attrs));
    }

    /**
     * @desc 过滤对象指定的属性 attrs = 过滤条件
     * 仅仅找到返回的第一条数据
     * */
    _levi.findWhere = function (obj, attrs) {
        return _levi.find(obj, _levi.matcher(attrs));
    }

    /***
     * @description 数组
     * */
    _levi.max = function (obj, iteratee, context) {
        var result = -Infinity,
            lastComputed = -Infinity,
            value, computed;
        if (!iteratee || typeof iteratee === 'number' && typeof obj[0] !== 'object' && obj) {
            obj = isArrayLike(obj) ? obj : _levi.values(obj);
            for (var i = 0; i < obj.length; i++) {
                value = obj[i];
                if (value && value > result) {
                    result = value;
                }
            }
        } else {
            iteretee = cb(iteratee, context);
            _levi.each(obj, function (value, index, list) {
                computed = iteratee(value, index, list);
                if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
                    result = value;
                    lastComputed = computed;
                }
            })
        }
        return result;
    }

    _levi.min = function (obj, iteratee, context) {
        var result = Infinity,
            lastComputed = Infinity,
            value, computed;
        if (!iteratee || typeof iteratee === 'number' && typeof obj[0] !== 'object' && obj) {
            obj = isArrayLike(obj) ? obj : _levi.values(obj);
            for (var i = 0; i < obj.length; i++) {
                value = obj[i];
                if (value && value < result) {
                    result = value;
                }
            }
        } else {
            iteretee = cb(iteratee, context);
            _levi.each(obj, function (value, index, list) {
                computed = iteratee(value, index, list);
                if (computed < lastComputed || computed === Infinity && result === Infinity) {
                    result = value;
                    lastComputed = computed;
                }
            })
        }
        return result;
    }

    var createPredicateIndexFinder = function (dir) {
        return function (array, predicate, context) {
            predicate = cb(predicate, context);
            var length = getLength(array);
            var index = dir > 0 ? 0 : length - 1;
            for (; index >= 0 && index < length; index += dir) {
                if (predicate(array[index], index, array)) {
                    return index;
                }
            }
            return -1;
        }
    }

    /**
     * @desc 查询特定的下标
     * 可用来比较数组 以及 对象
     * */
    _levi.findIndex = createPredicateIndexFinder(1); // 闭包使用
    _levi.findLastIndex = createPredicateIndexFinder(-1); // 闭包使用

    /** 
     * @desc 查询已经排序好的数组中特定的元素下标 => 使用了二分查发
     * @param array 被遍历数组
     * @param obj 查找的参数
     * @param iteratee 处理obj的函数
     * */
    _levi.sortedIndex = function (array, obj, iteratee, context) {
        iteratee = cb(iteratee, context, 1);
        var value = iteratee(obj);
        var low = 0,
            high = getLength(array);
        while (low < high) {
            var mid = Math.floor((low + high) / 2);
            if (iteratee(array[mid]) < value) {
                low = mid + 1;
            } else {
                high = mid;
            }
        }
        return low;
    }

    /**
     * @desc 工厂方法
     * */
    var createIndexFinder = function (dir, predicateFind, sortedIndex) {
        return function (array, item, idx) {
            var i = 0,
                length = getLength(array);
            if (typeof idx == 'number') {
                if (dir > 0) {
                    i = idx >= 0 ? idx : Math.max(idx + length, i);
                } else {
                    length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1; // + 1从后往前遍历的时候能遍历到最后一位数值
                }
            } else if (sortedIndex && idx && length) {
                idx = sortedIndex(array, item);
                return array[idx] === item ? idx : -1;
            }
            // 排除NaN 情况
            if (item !== item) {
                idx = predicateFind(slice.call(array, i, length), _levi.isNaN);
                return idx >= 0 ? idx + i : -1;
            }
            for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
                if (array[idx] === item) return idx;
            }
            return -1;
        };
    }

    _levi.indexOf = createIndexFinder(1, _levi.findIndex, _levi.sortedIndex);
    _levi.lastIndexOf = createIndexFinder(-1, _levi.findLastIndex);

    _levi.isMatch = function (object, attrs) {
        var keys = _levi.keys(attrs),
            length = keys.length;
        if (object === null) return !length;
        var obj = Object(object);
        for (var i = 0; i < length; i++) {
            var key = keys[i];
            if (attrs[key] !== obj[key] || !(key in obj)) return false;
        }
        return true;
    }

    // Infinity用来存放正无穷的数值，无法没for in 遍历到 
    _levi.shuffle = function (obj) {
        return _levi.sample(obj, Infinity);
    }

    /**
     * @description 洗牌算法 => 数组乱序
     * */
    _levi.sample = function (obj, n, guard) {
        // 如果没有传递n随机抽取一个
        if (!n || guard) {
            if (!isArrayLike(obj)) {
                obj = _levi.values(obj);
            }
            return obj[_levi.random(obj.length - 1)];
        }
        // 克隆数组或者对象
        var sample = isArrayLike(obj) ? _levi.clone(obj) : _levi.values(obj);
        var length = getLength(sample);
        n = Math.max(Math.min(n, length), 0); // 放置传入负数
        var last = length - 1;
        for (var index = 0; index < n; index++) {
            var rand = _levi.random(index, last);
            [sample[index], sample[rand]] = [sample[rand], sample[index]];
        }
        return sample.slice(0, n);
    }

    /** 
     * @description 数组排序
     * 
     * Array.sort(sortBy)  可接受一个函数
     * 
     * return 1: 降序排列
     * return -1: 升序排列
     * */
    _levi.sortBy = function (obj, iteratee, context) {
        var index = 0;
        iteratee = cb(iteratee, context);
        return _levi.pluck(_levi.map(obj, function (value, key, list) {
            return {
                value: value,
                index: index++,
                criteria: iteratee(value, key, list) // 排序准则
            };
        }).sort(function (left, right) {
            var a = left.criteria,
                b = right.criteria;
            if (a !== b) {
                if (a > b || a === void 0) return 1;
                if (a < b || b === void 0) return -1;
            }
            return left.index - right - index;
        }), 'value');
    }

    /*** 
     * @description 对象的分组操作
     * @param obj 目前对象
     * @param iterartee 集合迭代器
     * @returns result 返回数据
     * iteratee === 可以是特定属性也可以是回调函数
     * */
    var group = function (behavior, partition) {
        return function (obj, iteratee, context) {
            var result = partition ? [
                [],
                []
            ] : {};
            iteratee = cb(iteratee, context);
            _levi.each(obj, function (value, index) {
                var key = iteratee(value, index, obj); // 取回调函数返回值
                behavior(result, value, key); // 行为函数调用groupc传入的行为函数
            })
            return result;
        }
    }

    // 分组
    _levi.groupBy = group(function (result, value, key) {
        if (has(result, key)) {
            result[key].push(value)
        } else {
            result[key] = [value];
        }
    });

    // 选择不重复项
    _levi.indexBy = group(function (result, value, key) {
        result[key] = value;
    })

    // 分组计数
    _levi.countBy = group(function (result, value, key) {
        if (has(result, key)) {
            result[key]++;
        } else {
            result[key] = 1;
        }
    });

    _levi.size = function (obj) {
        if (!obj) return 0;
        return isArrayLike(obj) ? obj.length : _levi.keys(obj).length;
    }

    // 拆成2个数组，左边满意条件的数组，右边是不满意的数组
    _levi.partition = group(function (result, value, pass) {
        result[pass ? 0 : 1].push(value);
    }, true)


    /*****************************数组篇章****************************/
    _levi.first = _levi.head = _levi.take = function (array, n, guard) {
        if (!array || array.length < 1) return [];
        if (!n || guard) return array[0];
        return _levi.initial(array, array.length - n);
    }

    /** 
     * @desc 返回数组中 前n-1的新数组
     * */
    _levi.initial = function (array, n, guard) {
        return slice.call(array, 0, Math.max(0, array.length - (!n || guard ? 1 : n)));
    }

    _levi.last = function (array, n, guard) {
        if (!array || array.length < 1) return [];
        if (!n || guard) return array[array.length - 1];
        return _levi.rest(array, Math.max(0, array.length - n));
    }

    _levi.rest = _levi._tail = _levi.drop = function (array, n, guard) {
        return slice.call(array, !n || guard ? 1 : n);
    }

    /**
     * @desc 过滤掉数组为false的值，例如 false, '', undefined, null等
     * @desc 注明：只能展开对一维数组进行判断
     * @param Boolean 是一个函数
     * */
    _levi.compact = function (array) {
        return _levi.filter(array, Boolean);
    }

    /** 
     * @desc 数组降维
     * @param input 展开数组
     * @param shallow true的时候为赋值开展，false， 默认深度克隆 
     * 
     * index => output.length 记录数组length的变化
     * */
    var flatten = function (input, shallow, strict, output) {
        output = output || [];
        var index = output.length,
            length = getLength(input);
        for (var i = 0; i < length; i++) {
            var value = input[i];
            if (isArrayLike(value) && (_levi.isArray(value)) || _levi.isArguments(value)) {
                if (shallow) {
                    var j = 0,
                        len = value.length;
                    while (j < len) {
                        output[index++] = value[j++];
                    }
                } else {
                    flatten(value, shallow, strict, output); // 递归调用  传入output
                    index = output.length;
                }
            } else if (!strict) {
                output[index++] = value;
            }
        }
        return output;
    }

    _levi.flatten = function (array, shallow) {
        return flatten(array, shallow, false);
    }

    _levi.without = restArguments(function (array, otherArrays) {
        return _levi.difference(array, otherArrays);
    })

    _levi.uniq = _levi.unique = function (array, isSorted, iteratee, context) {
        if (isSorted === undefined || !_levi.isBoolean(isSorted)) {
            context = iteratee;
            iteratee = isSorted;
            isSorted = false;
        }

        if (iteratee) iteratee = cb(iteratee, context);
        var result = [];
        var seen = [];
        for (var i = 0; i < getLength(array); i++) {
            var value = array[i];
            computed = iteratee ? iteratee(value, i, array) : value;
            if (isSorted && !iteratee) {
                if (!i || seen !== computed) {
                    result.push(value);
                }
                seen = computed;
            } else if (iteratee) {
                if (!_levi.contains(seen, computed)) {
                    seen.push(computed);
                    result.push(value);
                }
            } else if (!_levi.contains(result, value)) {
                result.push(value);
            }
        }
        return result;
    }

    _levi.union = restArguments(function (arrays) {
        return _levi.uniq(flatten(arrays, true, true))
    });

    /*** 
     * @description 数组求交集
     * @param array 目标数组
     * */
    _levi.intersection = function (array) {
        var result = [];
        var argsLength = arguments.length;
        for (var i = 0; i < getLength(array); i++) {
            var item = array[i];
            if (_levi.contains(result, item)) continue;
            for (var j = 1; j < argsLength; j++) {
                if (!_levi.contains(arguments[j], item)) break; // 满足条件跳出本次for循环
            }
            if (j === argsLength) result.push(item)
        }
        return result;
    }

    /**
     * @description 求目前数组差集
     * */
    _levi.difference = restArguments(function (array, rest) {
        rest = flatten(rest, true, true);
        return _levi.filter(array, function (value) {
            return !_levi.contains(rest, value);
        });
    });

    /**
     * @description 压缩数组
     */
    _levi.unzip = function (array) {
        var length = array && _levi.max(array, getLength).length || 0;
        var result = Array(length);
        for (var index = 0; index < length; index++) {
            result[index] = _levi.pluck(array, index);
        }
        return result;
    }

    _levi.zip = restArguments(_levi.unzip);

    /**
     * @description 将list对象转化为Object
     * @param list 目标数组
     * @param values 要赋值的数组
     * */
    _levi.object = function (list, values) {
        var result = {};
        for (var i = 0; i < getLength(list); i++) {
            if (values) {
                result[list[i]] = values[i];
            } else {
                result[list[i][0]] = list[i][0];
            }
        }
        return result;
    }

    /** 
     * @description 切分数组
     * array.slice(i, n+1)  => return array[i] -- array[n];
     * */
    _levi.chunk = function (array, count) {
        if (!count || count < 1) {
            return [];
        }
        var result = [];
        var i = 0,
            length = array.length;
        while (i < length) {
            result.push(slice.call(array, i, i += count));
        }
        return result;
    }

    _levi.range = function (start, stop, step) {
        // 校正终点
        if (!stop) {
            stop = start || 0;
            start = 0;
        }

        if (!step) {
            step = stop < start ? -1 : 1;
        }

        var length = Math.max(Math.ceil((stop - start) / step), 0);

        var range = Array(length);
        for (var idx = 0; idx < length; idx++, start += step) {
            range[idx] = start;
        }
        return range;
    };

    _levi.clone = function (obj) {
        if (!_levi.isObject(obj)) return obj;
        return _levi.isArray(obj) ? obj.slice() : _levi.extend({}, obj);
    }

    /******************************函数相关*******************************/
    /***
     * 1、函数改变函数上下文有2种方式
     * @调用时绑定 => func.call(fn, xx) / func.apply(fn, [xx])
     * @定义时绑定 => var newFn = func.bind(fn); newFn();
     * 注明： 以上2种绑定都是在函数原型的挂载的方法
     * Function.prototype.call = fn
     * Function.prototype.apply = fn
     * Function.prototype.bind = fn
     * */

    /***
     * @desc 函数bind实现原理
     * */
    //  (function() {
    //     if (!Function.prototype.bind) {
    //         Function.prototype.bind = function(oThis) {
    //             if (typeof this !== 'function') {
    //                 return new Error('Function.prototype.bind - what is trying to be bound is not callable')
    //             }

    //             var args = Array.prototype.slice.call(arguments, 1),
    //             fToBind = this,
    //             fNop = function() {},
    //             fBound = function() {
    //                 return fToBind.apply(this instanceof fTop ? 
    //                     this : oThis, args.concat(Array.prototype.slice.call(arguments)))
    //             };

    //             fNop.prototype = this.prototype;
    //             fBound.prototype = new fNop();

    //             return fBound;
    //         }
    //     }
    //  })();

    var executeBound = function (sourceFunc, boundFunc, context, callingContext, args) {
        if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
        var self = baseCreate(sourceFunc.prototype);
        var result = sourceFunc.apply(self, args);
        if (_levi.isObject(result)) return result;
        return self;
    }

    /** 
     *  函数bind绑定 2次调用restArguments函数
     */
    _levi.bind = restArguments(function (func, context, args) {
        if (!_levi.isFunction(func)) {
            throw new Error('bind must be called on a function')
        }
        var bound = restArguments(function (callArgs) {
            return executeBound(func, bound, context, this, args.concat(callArgs));
        })
        return bound;
    });

    _levi.bindAll = restArguments(function (obj, keys) {
        keys = flatten(keys, false, false);
        var index = keys.index;
        if (index < 1) {
            throw new Error('bindAll must be function name');
        }
        while (index--) {
            var key = keys[index];
            obj[key] = _levi.bind(obj[key], obj);
        }
    })

    /** 
     * @description 函数局部参数拼接
     *  var add = function(a, b) { return a + b; };
            add5 = _.partial(add, 5);
            add5(10);
            => 15
     * */
    _levi.partial = restArguments(function (func, boundArgs) {
        var placeholder = _levi.partial.placeholder;
        var bound = function () {
            var position = 0,
                length = boundArgs.length;
            var args = Array(length);
            for (var i = 0; i < length; i++) {
                // 使用了 _levi可以进行占位符
                args[i] = boundArgs[i] === placeholder ? arguments[position++] : boundArgs[i];
            }
            // 如果arguments还没有被消费完, 则剩余arguments全部灌入args
            while (position < arguments.length) {
                args.push(arguments[position++]);
            }
            // 执行绑定函数，不改变函数上下文
            return executeBound(func, bound, this, this, args);
        }
        return bound;
    })

    _levi.partial.placeholder = _levi;

    /** 
     * @description 函数计算结果缓存
     * */
    _levi.memoize = function (func, hasher) {
        var memoize = function (key) {
            // 执行记忆函数，缓存数据
            var cache = memoize.cache;
            // 获取缓存地址
            var address = `${hasher ? hasher.apply(this, arguments) : key}`;
            // 如果没有缓存则执行函数
            !has(cache, address) ? cache[address] = func.apply(this, arguments) : null;
            return cache[address];
        }
        memoize.cache = {};
        return memoize;
    }

    /** 
     * @description 封装fn延时执行
     * */
    _levi.delay = restArguments(function (func, wait, args) {
        return setTimeout(() => {
            return func.apply(null, args)
        }, wait);
    })

    /** 
     * @description fn异步执行
     * 延迟 _levi.delay 传入的函数在1ms之后在执行
     * */
    _levi.defer = _levi.partial(_levi.delay, _levi, 1);

    /** 
     * @description 创建并返回一个像节流阀一样的函数,当重复调用函数时，最多每隔wait秒调用一次改函数
     * */
    _levi.throttle = function (func, wait, options) {
        var timerout, context, args, result;
        var previous = 0;
        if (!options) {
            options = {};
        }
        var later = function () {
            previous = options.leading === false ? 0 : _levi.now();
            timerout = null;
            result = func.apply(context, args);
            if (!timerout) {
                context = args = null;
            }
        }
        var throttled = function () {
            var now = _levi.now();
            if (!previous && options.leading === false) {
                previous = now;
            }
            var remaining = wait - (now - previous);
            context = this;
            args = arguments;
            if (remaining <= 0 || remaining > wait) {
                if (timerout) {
                    window.clearTimeout(timerout);
                    timerout = null;
                }
                previous = now;
                result = func.apply(context, args);
                if (!timerout) context = args = null;
            } else if (!timerout && options.trailing !== false) {
                timerout = window.setTimeout(later, remaining);
            }
            return result;
        }

        throttled.cancel = function () {
            window.clearTimeout(timerout);
            previous = 0;
            timerout = context = args = null;
        }
        return throttled;
    }

    /** 
     * @description debounce防抖函数, 在特定时间内只发送一次请求或者响应结果
     * */
    _levi.debounce = function (func, wait, immediate) {
        var timerout, result;
        var later = function (context, args) {
            timerout = null;
            if (args) {
                result = func.apply(context, args);
            }
        }

        var debounced = restArguments(function (args) {
            // 每次调用函数，都会清除之前设置的定时器 === 即之前计算结果无效
            if (timerout) window.clearTimeout(timerout);
            // 如果允许调用则会立即执行
            if (immediate) {
                // 如果之前没有被调用，那么也会立即执行
                var callNow = !timerout;
                timerout = window.setTimeout(later, wait);
                if (callNow) {
                    result = func.apply(this, args);
                }
            } else {
                timerout = _levi.delay(later, wait, this, args);
            }
        })

        debounced.cancel = function () {
            window.clearTimeout(timerout);
            timerout = null;
        }

        return debounced;
    }

    /** 
     * @description 函数组合
     * */
    _levi.compose = function () {
        var args = arguments;
        var start = args.length - 1;
        return function () {
            var i = start;
            var result = args[start].apply(this, arguments);
            while (i--) {
                result = args[i].call(this, result);
                return result;
            }
        }
    }

    /** 
     * @description 指定调用次数函数
     * */
    _levi.after = function (times, func) {
        return function () {
            if (--times < 1) {
                return func.apply(this, arguments)
            }
        }
    }

    _levi.before = function (times, func) {
        var memo;
        return function () {
            if (--times > 0) {
                memo = func.apply(this, arguments);
            }
            if (times <= 1) func = null;
            return memo;
        }
    }

    /** 
     * @description 只执行一次函数
     * */
    _levi.once = _levi.partial(_levi.before, 2);

    /** 
     * @description 将func封装成一个参数，传入到wrapper函数里面(func作为wrapper的第一个参数)
     *              使用wrapper对func进行包裹，在func执行前后，可以能融入更多的业务
     * */
    _levi.wrap = function (func, wrapper) {
        return _levi.partial(wrapper, func);
    }

    /** 
     * @description  
     * @param predicate 传入fn参数
     * @returns predicate 传入fn的副本
     * */
    _levi.negate = function (predicate) {
        return function () {
            return !predicate.apply(this, arguments);
        }
    }

    _levi.restArguments = restArguments;

    /******************************对象相关*******************************/
    /** 
     * @description 查询对象自己的key
     * */
    _levi.keys = function (obj) {
        if (!_levi.isObject(obj)) return [];
        if (nativeKeys) return nativeKeys(obj);
        var keys = [];
        // 直接剔除非自身属性，for in 循环还会遍历原型链上的属性
        for (var key in obj) {
            if (has(obj, key)) {
                keys.push(key);
            }
        }
        // ie < 9 之前枚举bug, 需要校正最后的属性集合
        if (hasEnumBug) collectNonEnumProps(obj, keys);
        return keys;
    }

    /** 
     * @description 会遍历原型链的key
     * */
    _levi.allKeys = function (obj) {
        if (!_levi.isObject) return [];
        var keys = [];
        // 直接遍历原型链上的所有方法
        for (var key in obj) {
            keys.push(key);
        }
        // ie < 9
        if (hasEnumBug) {
            collectNonEnumProps(obj, keys);
            return keys;
        }
        return keys;
    }

    /** 
     * @description 获取对象上value值的集合
     * @point const arr = Array(length) === 创建特定长度的数组
     */
    _levi.values = function (obj) {
        var keys = _levi.keys(obj);
        var length = keys.length;
        var values = Array(length);
        for (var i = 0; i < length; i++) {
            values[i] = obj[keys[i]];
        }
        return values;
    }

    /** 
     * @description 判断对象是否包含某个属性，可以接受数组
     * */
    _levi.has = function (obj, path) {
        if (!_levi.isArray(path)) {
            return has(obj, path);
        }
        var length = path.length;
        for (var i = 0; i < length; i++) {
            var key = path[i];
            if (!obj || !hasOwnProperty.call(obj, key)) {
                return false;
            }
            obj = obj[key];
        }
        return !!length;
    }

    /** 
     * @description 把一个对象转变为一个[key, value]形式的数组 
     * @point 一维数组，没有进行深度降维处理
     * */
    _levi.pairs = function (obj) {
        const keys = _levi.keys(obj);
        const length = keys.length;
        const pairs = Array(length);
        for (let i = 0; i < length; i++) {
            pairs[i] = [keys[i], obj[keys[i]]];
        }
        return pairs;
    }

    /** 
     * @description 返回一个新对象，新对象的 key，value都是颠倒过来的
     * */
    _levi.invert = function (obj) {
        const result = {};
        const keys = _levi.keys(obj);
        const length = keys.length;
        for (let i = 0; i < length; i++) {
            result[obj[keys[i]]] = keys[i];
        }
        return result;
    }

    /** 
     * @description 返回一个对象的所有方法名，注意返回的函数列表会按照字典ascii进行排序
     * @description for in 循环和 Object.keys() 方法都会返回对象本身属性以及原型链上可以枚举的属性
     * */
    _levi.functions = _levi.methods = function (obj) {
        var labels = [];
        for (var key in obj) {
            if (_levi.isFunction(obj[key])) {
                labels.push(key);
            }
        }
        return labels.sort();
    }

    /** 
     * @desc 对象的浅克隆
     * @param obj 主对象
     * @param arguments 传入参数序列
     * */
    var createAssigner = function (keysFunc, defaults) {
        return function (obj) {
            // 参数长度反映了传入对象对象的个数
            var length = arguments.length;
            if (defaults) obj = Object(obj);
            if (length < 2 || obj === null) return obj;
            // 遍历传入的每个属性
            for (var index = 1; index < length; index++) {
                var source = arguments[index];
                keys = keysFunc(source);
                l = keys.length;
                for (var i = 0; i < l; i++) {
                    var key = keys[i];
                    // 如果不是default或者obj[key] 为undefined时候，覆盖原来的属性
                    if (!defaults || obj[key] === void 0) obj[key] = source[key]
                }
            }
            return obj;
        }
    }

    // 同时会克隆目标对象原型链的属性
    _levi.extend = createAssigner(_levi.allKeys);
    // 只会克隆目标对象自身属性
    _levi.extendOwn = _levi.assign = createAssigner(_levi.keys);
    // 设置对象默认属性 === 对象原来有属性不会覆盖
    _levi.default = createAssigner(_levi.allKeys, true);

    /** 
     * @description 克隆对象 
     * @point 克隆方式是浅客量
     * */
    _levi.clone = function (obj) {
        if (!_levi.isObject(obj)) return obj;
        return _levi.isArray(obj) ? obj.slice() : _levi.extend({}, obj);
    }

    /** 
     * @description 深度克隆
     * */
    function objectType(source) {
        return Object.prototype.toString.call(source).slice(8, -1);
    }

    _levi.deepClone = function (source) {
        let target;
        const type = objectType(source);
        target = (type === 'Object' ? {} : type === 'Array' ? [] : target);
        for (let key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
                // 如果是引用数据类型
                if (objectType(source[key]) === 'Object' || objectType(source[key]) === 'Array') {
                    target[key] = _levi.deepClone(source[key]);
                } else {
                    target[key] = source[key];
                }
            }
        }
        return target;
    }

    /** 
     * @description 设置白名单 过滤掉一些对象不需要的属性
     * @point 接受一个好参数序列 / 函数，返回一个新的对象
     * */
    var keyInObj = function (value, key, obj) {
        return key in obj;
    }

    _levi.pick = restArguments(function (obj, keys) {
        const result = {};
        let iteratee = keys[0];
        if (!obj) return result;
        // 白名单机制最终都会落脚到一个真值检验函数上，无论第二个参数是一个函数还是一个个的keys
        if (_levi.isFunction(iteratee)) {
            if (keys.length > 1) {
                iteratee = optimizeCb(iteratee, keys[1]);
            }
            keys = _levi.allKeys(obj);
        } else {
            iteratee = keyInObj;
            // 将keys降维 即传入的参数可以是一个数组 _levi.pick(obj,[xx, xx]);
            keys = flatten(keys, false, false);
            // 初始化对象
            obj = Object(obj);
        }
        for (var i = 0, length = keys.length; i < length; i++) {
            var key = keys[i];
            var value = obj[key];
            if (iteratee(value, key, obj)) {
                result[key] = value;
            }
        }
        return result;
    });

    /** 
     * @description 黑名单 ===> 白名单取反用法
     * */
    _levi.omit = restArguments(function (obj, keys) {
        let context;
        let iteratee = keys[0];
        if (_levi.isFunction(iteratee)) {
            iteratee = _levi.negate(iteratee);
            if (keys.length > 1) {
                context = keys[1];
            }
        } else {
            keys = _levi.map(flatten(keys, false, false), String);
            iteratee = function (value, key) {
                return !_levi.contains(keys, key);
            }
        }
        return _levi.pick(obj, iteratee, context);
    });

    /** 
     * @description  链式操作的一换
     * @returns obj
     * */
    _levi.tap = function (obj, interceptor) {
        interceptor(obj);
        return obj;
    }

    /** 
     * @description 获取指定对象指定的key对应的value
     * */
    _levi.property = function (path) {
        if (!_levi.isArray(path)) {
            return shallowProperty(path); // 闭包
        }
        return function (obj) {
            return deepGet(obj, path);
        }
    }

    /**
     * @description 判断2个对象是否相等
     * */
    _levi.matcher = _levi.matches = function (attrs) {
        attrs = _levi.extendOwn({}, attrs);
        return function (obj) {
            // 闭包实现
            return _levi.isMatch(obj, attrs);
        }
    }

    /** 
     * @description 基本类型对比
     * */
    function eq(a, b, aStack, bStack) {
        // 排除 0 -0 情况
        if (a === b) return a !== 0 || 1 / a === 1 / b;
        /** 
         * @description 排除 a b 是null 和 undefined情况  
         * 注明： null == undefined  true
         * 注明： null === undefined  false
         * */
        if (a == null || b == null) return false;
        // 排除NaN情况
        if (a !== a) return b !== b;
        const type = typeof a;
        // 验证a,b是对象的情况
        if (type === 'function' || type === 'object' || typeof b === 'object') {
            return deepEq(a, b, aStack, bStack);
        } else {
            return false;
        }
    }

    /** 
     * @description 深度比较
     * */
    function deepEq(a, b, aStack, bStack) {
        if (a instanceof _levi) a = a._leviwrapped;
        if (b instanceof _levi) b = b._leviwrapped;
        // 比较数据类型
        var className = toString.call(a);
        if (className !== toString.call(b)) return false;

        switch (className) {
            case '[object RegExp]':
            case '[object String]':
                return `${a}` === `${b}`;
            case '[object] Number]':
                // 排除NaN情况 
                if (+a !== +a) {
                    return +b !== +b;
                } else {
                    return +a === 0 ? 1 / +a === 1 / b : +a === +b;
                }
                case '[object Date]':
                case '[object Boolean]':
                    return +a === +b;
                case '[object Symbol]':
                    return symbolProto.valueOf.call(a) === symbolProto.valueOf.call(b);
        }

        // 比较一般的实例化对象, 如果构造函数不一样, 那么实例化对象肯定是不一样
        var areArrays = className === '[object Array]';
        // className === [object object];
        if (!areArrays) {
            // (type === 'function' || type === 'object' || typeof b === 'object') 判断这种情况
            if (typeof a != 'object' || typeof b != 'object') return false;

            // 构造函数不同，那么必然是不相等的
            var aCtor = a.constructor,
                bCtor = b.constructor;
            if (aCtor !== bCtor && (!_levi.isFunction(aCtor) && aCtor instanceof aCtor &&
                    !_levi.isFunction(bCtor) && bCtor instanceof bCtor) && ('constructor' in a && 'constructor' in b)) {
                return false;
            }
        }

        // 比较数组、对象
        aStack = aStack || [];
        bStack = bStack || [];
        var length = aStack.length;
        while (length--) {
            // aStack && bStack 防止无线递归遍历 数组或者对象引用自身情况
            if (aStack[length] === a) return bStack[length] = b;
        }

        /** 
         * @description aStack && bStack 引用自身从而造成无线递归调用
         * 记录了上级（父级）的引用，当子元素指向父元素时（循环引用），可以通过引用比较跳出无限递归。
         * */
        aStack.push(a);
        bStack.push(b);

        // 比较数组
        if (areArrays) {
            length = a.length;
            if (length !== b.length) return false;
            while (length--) {
                // 递归深度遍历比较
                if (!eq(a[length], b[length], aStack, bStack)) {
                    return false;
                }
            }
        } else {
            // 比较对象
            var keys = _levi.keys(a),
                key;
            length = keys.length;
            if (_levi.keys(b).length !== length) return false;
            while (length--) {
                key = keys[length];
                // 排除对象 key value不一致情况  / 递归深度遍历比较
                if (!(has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
            }
        }

        // 清空引用栈 
        aStack.pop();
        bStack.pop();
        return true;
    }

    _levi.isEqual = function (a, b) {
        return eq(a, b);
    }


    _levi.isEmpty = function (obj) {
        if (obj == null) return true;
        if (isArrayLike(obj) && (_levi.isArray(obj) || _levi.isString(obj) || _levi.isArguments(obj))) {
            return obj.length === 0;
        }
        return _levi.keys(obj).length === 0;
    }

    _levi.isElement = function (obj) {
        return !!(obj && obj.nodeType === 1);
    }

    /** 
     * @description 实现一些基本功能
     * Add some isType methods: isArguments, isFunction, isString, .isNumber, isDate, 
     * isRegExp, isError, isMap, isWeakMap, isSet, isWeakSet.
     * */
    _levi.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error',
        'Symbol', 'Map', 'WeapMap', 'Set', 'WeakSet'
    ], function (name) {
        _levi[`is${name}`] = function (obj) {
            return toString.call(obj) === `[object ${name}]`;
        }
    })

    _levi.isObject = function (obj) {
        // !!obj 过滤null情况
        var type = typeof obj;
        return type === 'function' || type === 'object' && !!obj;
    }

    _levi.isArray = nativeIsArray || function (obj) {
        return toString.call(obj) === '[object Array]';
    }

    _levi.isNaN = function (obj) {
        return _levi.isNumber(obj) && isNaN(obj);
    }

    _levi.isBoolean = function (obj) {
        return obj === true || obj === false || toString.call(obj) === "[object Boolean]";
    }

    _levi.isNull = function (obj) {
        return obj === null;
    }

    _levi.isUndefined = function (obj) {
        return obj === undefined;
    }

    var nodelist = root.document && root.document.childNodes;
    if (typeof /./ != 'function' && typeof Int8Array != 'object' && typeof nodelist != 'function') {
        _levi.isFunction = function (obj) {
            return typeof obj == 'function' || false;
        };
    }

    /****************************常用工具方法相关***************************/
    /** 
     * @description 防止命名冲突
     * */
    _levi.noConflict = function () {
        root._levi = previousUnderscore;
        return this;
    }

    /** 
     * @description 返回与传入值,不做任何处理
     * */
    _levi.indentity = function (value) {
        return value;
    }

    /** 
     * @description 引用value闭包
     * */
    _levi.constant = function (value) {
        // 引入value(实参)的值
        return function () {
            return value;
        }
    }

    _levi.times = function (n, iteratee, context) {
        var num = Array(Math.max(0, n));
        iteratee = optimizeCb(iteratee, context, 1);
        for (var i = 0; i < n; i++) {
            num[i] = iteratee(i);
        }
        return num;
    }

    /** 
     * @description 返回空函数的引用
     * */
    _levi.noop = function () {};

    /** 
     * @description 获取元素
     * */
    _levi.propertyOf = function (obj) {
        if (obj == null) {
            return function () {}
        }
        return function (path) {
            return !_levi.isArray(path) ? obj[path] : deepGet(obj, path);
        }
    }

    /** 
     * @desc 取数组中元素, 当数组长度是0的时候，min = 0， max = -1
     * */
    _levi.random = function (min, max) {
        if (!max) {
            max = min;
            min = 0;
        }
        return min + Math.floor(Math.random() * (max - min + 1));
    }

    /** 
     * @description 获取当前时间戳
     * */
    _levi.now = Date.now || function () {
        return (new Date()).getTime();
    }

    var eacapeMap = {
        '&': '&amp',
        '<': '&lt',
        '>': '&gt',
        '"': '&quot',
        "'": '&#x27',
        '`': '&#x60'
    };
    var unescapeMap = _levi.invert(eacapeMap); // 反转key / value

    /** 
     * @description 对html字符串进行逃逸||反逃逸处理
     * @param map 是一个对象
     * */
    var createEscaper = function (map) {
        var escaper = function (match) {
            return map[match];
        }
        // 动态创建正则表达式
        var source = `(?:${_levi.keys(map).join('|')})`;
        // 测试正则与替换正则
        var testRegexp = RegExp(source);
        var replaceRegxep = RegExp(source, 'g');
        return function (string) {
            string = string == null ? '' : '' + string;
            return testRegexp.test(string) ? string.replace(replaceRegxep, escaper) : string;
        }
    }
    // 正向解析
    _levi.escape = createEscaper(eacapeMap);
    // 反向解析
    _levi.unescape = createEscaper(unescapeMap);

    /**
     * @description result 如果props是成员方法就调用，否则就是输出属性
     */
    _levi.result = function (obj, path, fallBack) {
        if (!_levi.isArray(path)) path = [path];
        var length = path.length;
        if (!length) {
            return _levi.isFunction(fallBack) ? fallBack.call(obj) : fallBack;
        }
        for (var i = 0; i < length; i++) {
            var props = obj == null ? void 0 : obj[path[i]];
            if (!props) {
                props = fallBack;
                i = length;
            }
            obj = _levi.isFunction(props) ? props.call(obj) : props;
        }
        return obj;
    }

    /** 
     * @description 生成一个带有前缀的唯一值
     * */
    var idCount = 0;
    _levi.uniqueId = function (prefix) {
        var id = ++idCount + '';
        return prefix ? prefix + id : id;
    }

    /**
     * @description 链式调用
     * @description 添加链函数，开始链接已经包装的下划线函数
     * @returns 返回undersource包装的实例
     * */
    _levi.chain = function (obj) {
        var instance = _levi(obj);
        instance._chain = true;
        return instance;
    }

    /** 
     * @description 寻找对象特定的key
     * */
    _levi.findKey = function (obj, predicate, context) {
        predicate = cb(predicate, context);
        var keys = _keys(obj).length;
        for (var i = 0; i < keys.length; i++) {
            key = keys[i];
            if (predicate(obj[key], key, obj)) return key;
        }
    }

    /*** 
     * @desc 返回数组类型中特定key的值
        var users = [
            { name: 'wxj', age: 18, sex: 'male' },
            { name: 'zxy', sex: 'male' },
            { name: 'zhangsan', age: 14, sex: 'famale' }
        ];
        var ret = _levi.pluck(users, 'age');        // [18, undefined, 14]
     * */
    _levi.pluck = function (array, key) {
        return _levi.map(array, _levi.property(key));
    }

    /** 
     * @description 链式调用
     * _levi(obj).chain() 返回实例化obj obj中_chain 已经加入true中
     * */
    var chainResult = function (instance, obj) {
        return instance._chain ? _levi(obj).chain() : obj;
    }

    /** 
     * @description 将构造函数内部的静态方法静态加载至原型链上去
     * */
    _levi.mixin = function (obj) {
        _levi.each(_levi.functions(obj), function (name) {
            var func = _levi[name] = obj[name]; // 挂载在_levi构造函数，可以被直接调用
            _levi.prototype[name] = function () {
                var args = [this._leviwrapped]; // 构造函数实例化的时候指向
                push.apply(args, arguments);
                return chainResult(this, func.apply(_levi, args)); // func闭包的使用， this => 指向构造函数的实例
            }
        })
    }

    if (_levi.isArguments(arguments)) {
        _levi.isArguments = function (obj) {
            return has(obj, 'callee');
        }
    }

    _levi.mixin(_levi); // 静态方法方法拷贝到原型对象上
    _levi.mixin({
        adds(...name) {
            console.log(name);
            console.log(this);
            // return this;                             // 一般最后需要this返回功供后续调用
        }
    }); // 扩展工具方法

    _levi.each(['concat', 'join', 'slice'], function () {
        var method = ArrayProto[name];
        _levi.prototype[name] = function () {
            return chainResult(this, method.apply(this._leviwrapped, arguments));
        }
    })

    _levi.prototype.value = function () {
        return this._leviwrapped;
    }

    _levi.prototype.valueOf = _levi.prototype.toJson = _levi.prototype.value;

    _levi.prototype.toString = function () {
        return String(this._leviwrapped);
    }

    /** 
     * @description amd规范
     * */
    if (typeof define == 'function' && define.amd) {
        define('underscore', [], function () {
            return _levi;
        })
    }

})();