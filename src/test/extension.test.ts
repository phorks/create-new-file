import * as assert from "assert";
import { expandPath } from "../pathExpansion";

suite("Extension Test Suite", () => {
    test('expansionTest1', () => {
        assert.deepStrictEqual(expandPath('{a,b}.txt'), ['a.txt', 'b.txt']);
    });

    test('expansionTest2', () => {
        assert.deepStrictEqual(expandPath('x{a{b,c}d,e}y'), ['xabdy', 'xacdy', 'xey']);
    });

    test('expansionTest3', () => {
        assert.deepStrictEqual(expandPath('x{a{b,c}d,ey'), ['x{a{b,c}d,ey']);
    });

    test('expansionTest4', () => {
        assert.deepStrictEqual(expandPath('{a,}.txt'), ['a.txt', '.txt']);
    })
});