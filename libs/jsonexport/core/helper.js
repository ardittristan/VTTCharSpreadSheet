'use strict';

export function isFunction (fn) {
    var getType = {};
    return fn && getType.toString.call(fn) === '[object Function]';
}

export function isArray (arr) {
    return Array.isArray(arr);
}

export function isObject (obj) {
    return obj instanceof Object;
}

export function isString (str) {
    return typeof str === 'string';
}

export function isNumber (num) {
    return typeof num === 'number';
}

export function isBoolean (bool) {
    return typeof bool === 'boolean';
}

export function isDate (date) {
    return date instanceof Date;
}