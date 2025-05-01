import { reduceObjectToPaths } from './reduceObjectToPaths';

describe('reduceObjectToPaths', () => {
    const stringMapper = (value: any) => String(value);

    it('should handle primitive values with no parent path', () => {
        expect(reduceObjectToPaths(42, stringMapper)).toEqual(new Map());
        expect(reduceObjectToPaths('hello', stringMapper)).toEqual(new Map());
        expect(reduceObjectToPaths(true, stringMapper)).toEqual(new Map());
    });

    it('should handle null and undefined', () => {
        expect(reduceObjectToPaths(null, stringMapper, 'test')).toEqual(
            new Map([['test', 'null']])
        );
        expect(reduceObjectToPaths(undefined, stringMapper, 'test')).toEqual(
            new Map([['test', 'undefined']])
        );
    });

    it('should handle flat arrays', () => {
        const input = [1, 2, 3];
        const expected = new Map([
            ['0', '1'],
            ['1', '2'],
            ['2', '3'],
        ]);
        expect(reduceObjectToPaths(input, stringMapper)).toEqual(expected);
    });

    it('should handle flat objects', () => {
        const input = { a: 1, b: 2, c: 3 };
        const expected = new Map([
            ['a', '1'],
            ['b', '2'],
            ['c', '3'],
        ]);
        expect(reduceObjectToPaths(input, stringMapper)).toEqual(expected);
    });

    it('should handle nested objects', () => {
        const input = {
            a: {
                b: [1, 2, 3]
            }
        };
        const expected = new Map([
            ['a', '[object Object]'],
            ['a.b', '1,2,3'],
            ['a.b.0', '1'],
            ['a.b.1', '2'],
            ['a.b.2', '3'],
        ]);
        expect(reduceObjectToPaths(input, stringMapper)).toEqual(expected);
    });

    it('should handle complex nested structures', () => {
        const input = {
            name: 'John',
            age: 30,
            address: {
                street: 'Main St',
                numbers: [1, 2, 3],
                details: {
                    isActive: true
                }
            }
        };
        const expected = new Map([
            ['name', 'John'],
            ['age', '30'],
            ['address', '[object Object]'],
            ['address.street', 'Main St'],
            ['address.numbers', '1,2,3'],
            ['address.numbers.0', '1'],
            ['address.numbers.1', '2'],
            ['address.numbers.2', '3'],
            ['address.details', '[object Object]'],
            ['address.details.isActive', 'true'],
        ]);
        expect(reduceObjectToPaths(input, stringMapper)).toEqual(expected);
    });

    it('should work with custom mapper functions', () => {
        const input = { a: 1, b: 2 };
        const multiplyByTwoMapper = (value: any): number | Record<string, number> => 
            typeof value === 'number' ? value * 2 : value;
        
        type MapValue = number | Record<string, number>;
        const expected = new Map<string, MapValue>([
            ['a', 2],
            ['b', 4],
        ]);
        expect(reduceObjectToPaths(input, multiplyByTwoMapper)).toEqual(expected);
    });

    it('should handle objects with no mapper function', () => {
        const input = {
            a: 1,
            b: {
                c: [1, 2],
                d: true
            }
        };
        const expected = new Map([
            ['a', null],
            ['b', null],
            ['b.c', null],
            ['b.c.0', null],
            ['b.c.1', null],
            ['b.d', null],
        ]);
        expect(reduceObjectToPaths(input)).toEqual(expected);
    });
}); 