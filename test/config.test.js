const test = require('node:test');
const assert = require('node:assert/strict');
const { merge } = require('../src/config');
test('deep config merge preserves defaults', () => assert.deepEqual(merge({a:{b:1,c:2}}, {a:{b:3}}), {a:{b:3,c:2}}));
