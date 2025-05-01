import { getAllPaths } from './getAllPaths';

describe('getAllPaths', () => {
    it('should handle primitive values with no parent path', () => {
        expect(getAllPaths(42)).toEqual(new Set());
        expect(getAllPaths('hello')).toEqual(new Set());
        expect(getAllPaths(true)).toEqual(new Set());
    });

    it('should handle null and undefined', () => {
        expect(getAllPaths(null, undefined, 'test')).toEqual(new Set(['test']));
        expect(getAllPaths(undefined, undefined, 'test')).toEqual(new Set(['test']));
    });

    it('should handle flat arrays', () => {
        const input = [1, 2, 3];
        const expected = new Set([ '0', '1', '2']);
        expect(getAllPaths(input)).toEqual(expected);
    });

    it('should handle flat objects', () => {
        const input = { a: 1, b: 2, c: 3 };
        const expected = new Set(['a', 'b', 'c']);
        expect(getAllPaths(input)).toEqual(expected);
    });

    it('should handle nested objects', () => {
        const input = {
            a: {
                b: [1, 2, 3]
            }
        };
        const expected = new Set([
            'a',
            'a.b',
            'a.b.0',
            'a.b.1',
            'a.b.2'
        ]);
        expect(getAllPaths(input)).toEqual(expected);
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
        const expected = new Set([
            'name',
            'age',
            'address',
            'address.street',
            'address.numbers',
            'address.numbers.0',
            'address.numbers.1',
            'address.numbers.2',
            'address.details',
            'address.details.isActive'
        ]);
        expect(getAllPaths(input)).toEqual(expected);
    });

    describe('with filter function', () => {
        it('should only include paths where filter returns true', () => {
            const input = {
                name: 'John',
                age: 30,
                scores: [85, 90, 95],
                details: {
                    active: true,
                    points: 100
                }
            };

            const numberFilter = (value: any) => typeof value === 'number';
            const expected = new Set([
                'age',
                'scores.0',
                'scores.1',
                'scores.2',
                'details.points'
            ]);
            expect(getAllPaths(input, numberFilter)).toEqual(expected);
        });

        it('should handle boolean filter', () => {
            const input = {
                name: 'John',
                settings: {
                    isActive: true,
                    isAdmin: false,
                    preferences: {
                        emailNotifications: true
                    }
                }
            };

            const booleanFilter = (value: any) => typeof value === 'boolean';
            const expected = new Set([
                'settings.isActive',
                'settings.isAdmin',
                'settings.preferences.emailNotifications'
            ]);
            expect(getAllPaths(input, booleanFilter)).toEqual(expected);
        });

        it('should handle array filter', () => {
            const input = {
                items: [1, 2, 3],
                groups: {
                    a: [4, 5],
                    b: [6, 7]
                },
                single: 8
            };

            const arrayFilter = (value: any) => Array.isArray(value);
            const expected = new Set([
                'items',
                'groups.a',
                'groups.b'
            ]);
            expect(getAllPaths(input, arrayFilter)).toEqual(expected);
        });
    });
}); 