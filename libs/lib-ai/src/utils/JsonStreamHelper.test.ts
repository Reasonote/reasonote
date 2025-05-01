import {
  describe,
  expect,
  it,
} from 'vitest';

import { JsonStreamHelper } from './JsonStreamHelper';

/*
Requirements:

We will receive a JSON object or JSON array as input.

The JSON can be nested arbitrarily deep.

Consider an array with objects in it: 

[
    {
        foo: "bar"
    },
    {
        bazzzz: {
            lehrman: [1, 2, 3]
        }
    }
]

This object may be constructed iteratively, such that once a key or value has been "completed", it will never be touched again.

So, this might stream in as:

    CHUNK 1:
    [
        {
            foo: ""
        }
    ]

    CHUNK 3:
    [
        {
            foo: "bar"
        },
        {
            bazzzz: {
                lehrman: []
            }
        }
    ]

    CHUNK 4:
    [
        {
            foo: "bar"
        },
        {
            bazzzz: {
                lehrman: [1, 2, 3]
            }
        }
    ]


We want a JSONStreamHelper that can handle this, and produce a text stream smoothly.


There are some odd edge cases here:
- Keys don't stream in alphabetically, so we can't rely on JSON.stringify.

*/



describe('JsonStreamHelper Basic', () => {
    it('should handle simple object updates', () => {
        const helper = new JsonStreamHelper();
        
        // Initial partial object
        expect(helper.getNextChunk([{ "hello": "" }]))
            .toBe('[{"hello":"');

        // Update to complete word
        expect(helper.getNextChunk([{ "hello": "world" }]))
            .toBe('world');
            
        // Final closing bracket
        expect(helper.getNextChunk([{ "hello": "world" }], true))
            .toBe('"}]');

        expect(helper.getAllText()).toBe('[{"hello":"world"}]');
    });

    it('should handle multiple object updates', () => {
        const helper = new JsonStreamHelper();
        
        expect(helper.getNextChunk([{ "status": "thinking" }]))
            .toBe('[{"status":"thinking');
            
        expect(helper.getNextChunk([{ "status": "thinking" }, { "status": "working" }]))
            .toBe('"},{"status":"working');
            
        expect(helper.getNextChunk([{ "status": "thinking" }, { "status": "working" }], true))
            .toBe('"}]');

        expect(helper.getAllText()).toBe('[{"status":"thinking"},{"status":"working"}]');
    });

    it('should handle nested object updates', () => {
        const helper = new JsonStreamHelper();
        
        expect(helper.getNextChunk([{ "data": { "progress": 5 } }]))
            .toBe('[{"data":{"progress":5');
            
        expect(helper.getNextChunk([{ "data": { "progress": 500000000 } }]))
            .toBe('00000000');
            
        expect(helper.getNextChunk([{ "data": { "progress": 500000000 } }], true))
            .toBe('}}]');

        expect(helper.getAllText()).toBe('[{"data":{"progress":500000000}}]');
    });

    it('should reset properly', () => {
        const helper = new JsonStreamHelper();
        
        expect(helper.getNextChunk([{ "test": 1 }]))
            .toBe('[{"test":1');
            
        helper.reset();
        
        expect(helper.getNextChunk([{ "new": 2 }]))
            .toBe('[{"new":2');

        expect(helper.getNextChunk([{ "new": 2 }], true))
            .toBe('}]');

        expect(helper.getAllText()).toBe('[{"new":2}]');
    });
});

describe('JsonStreamHelper Array Handling', () => {
    it('should handle simple array updates', () => {
        const helper = new JsonStreamHelper();
        
        expect(helper.getNextChunk([[1, 2]])).toBe('[[1,2');
        expect(helper.getNextChunk([[1, 2]], true)).toBe(']]');
        
        expect(helper.getAllText()).toBe('[[1,2]]');
    });

    it('should handle streaming array elements', () => {
        const helper = new JsonStreamHelper();
        
        expect(helper.getNextChunk([[]])).toBe('[[');
        expect(helper.getNextChunk([[1]])).toBe('1');
        expect(helper.getNextChunk([[1, 2]])).toBe(',2');
        expect(helper.getNextChunk([[1, 2, 3]])).toBe(',3');
        expect(helper.getNextChunk([[1, 2, 3]], true)).toBe(']]');
        
        expect(helper.getAllText()).toBe('[[1,2,3]]');
    });

    it('should handle array of objects being built incrementally', () => {
        const helper = new JsonStreamHelper();
        
        expect(helper.getNextChunk([
            { name: "" }
        ])).toBe('[{"name":"');
        
        expect(helper.getNextChunk([
            { name: "Alice" }
        ])).toBe('Alice');
        
        expect(helper.getNextChunk([
            { name: "Alice" },
            { name: "" }
        ])).toBe('"},{"name":"');
        
        expect(helper.getNextChunk([
            { name: "Alice" },
            { name: "Bob" }
        ])).toBe('Bob');
        
        expect(helper.getNextChunk([
            { name: "Alice" },
            { name: "Bob" }
        ], true)).toBe('"}]');
        
        expect(helper.getAllText()).toBe('[{"name":"Alice"},{"name":"Bob"}]');
    });
});

describe('JsonStreamHelper Complex Structures', () => {
    it('should handle deeply nested object updates', () => {
        const helper = new JsonStreamHelper();
        
        expect(helper.getNextChunk([{
            level1: { level2: { level3: { value: "de" } } }
        }])).toBe('[{"level1":{"level2":{"level3":{"value":"de');
        
        expect(helper.getNextChunk([{
            level1: { level2: { level3: { value: "deep" } } }
        }])).toBe('ep');
        
        expect(helper.getNextChunk([{
            level1: { level2: { level3: { value: "deep" } } }
        }], true)).toBe('"}}}}]');
        
        expect(helper.getAllText())
            .toBe('[{"level1":{"level2":{"level3":{"value":"deep"}}}}]');
    });

    it('should handle mixed nested arrays and objects', () => {
        const helper = new JsonStreamHelper();
        
        expect(helper.getNextChunk([{
            data: { items: [] }
        }])).toBe('[{"data":{"items":[');
        
        expect(helper.getNextChunk([{
            data: { items: [{ id: 1 }] }
        }])).toBe('{"id":1');
        
        expect(helper.getNextChunk([{
            data: { items: [{ id: 1 }, { id: 2 }] }
        }])).toBe('},{"id":2');
        
        expect(helper.getNextChunk([{
            data: { items: [{ id: 1 }, { id: 2 }] }
        }], true)).toBe('}]}}]');
        
        expect(helper.getAllText())
            .toBe('[{"data":{"items":[{"id":1},{"id":2}]}}]');
    });


    it('should handle objects which have middle properties which are updated', () => {
        const helper = new JsonStreamHelper();

        // Add chunk with empty message in the middle of the object.
        expect(helper.getNextChunk([{
            type: 'message',
            message: '',
            id: '0_0_message'
        }])).toBe('[{');


        // Now, update that message to be non-empty.
        // This is valid because object ordering is not guaranteed.
        expect(helper.getNextChunk([{
            type: 'message',
            message: 'Plants convert',
            id: '0_0_message'
        }])).toBe('"type":"message","id":"0_0_message","message":"Plants convert');

        // Now, send the final chunk and force completion.
        expect(helper.getNextChunk([{
            type: 'message',
            message: 'Plants convert',
            id: '0_0_message'
        }], true)).toBe('"}]');

        expect(helper.getAllText()).toBe('[{"type":"message","id":"0_0_message","message":"Plants convert"}]');
    });
});

describe('JsonStreamHelper Edge Cases', () => {
    it('should handle empty string to non-empty string transitions', () => {
        const helper = new JsonStreamHelper();
        
        expect(helper.getNextChunk([{ text: "" }]))
            .toBe('[{"text":"');
            
        expect(helper.getNextChunk([{ text: "hello" }]))
            .toBe('hello');
            
        expect(helper.getNextChunk([{ text: "hello world" }]))
            .toBe(' world');
            
        expect(helper.getNextChunk([{ text: "hello world" }], true))
            .toBe('"}]');
    });

    it('should handle special characters in strings', () => {
        const helper = new JsonStreamHelper();
        
        expect(helper.getNextChunk([{ special: "" }]))
            .toBe('[{"special":"');
            
        expect(helper.getNextChunk([{ special: "\"quotes\"" }]))
            .toBe('\"quotes\"');
            
        expect(helper.getNextChunk([{ special: "\"quotes\"\n\t" }]))
            .toBe('\n\t');
            
        expect(helper.getNextChunk([{ special: "\"quotes\"\n\t" }], true))
            .toBe('"}]');
    });

    it('should handle null and undefined values', () => {
        const helper = new JsonStreamHelper();
        
        expect(helper.getNextChunk([{ 
            nullValue: null,
            undefinedValue: undefined
        }])).toBe('[{');

        expect(helper.getNextChunk([{ 
            nullValue: null,
            undefinedValue: undefined,
            numberValue: 42
        }])).toBe('"nullValue":null,"undefinedValue":null');

        expect(helper.getNextChunk([{ 
            nullValue: null,
            undefinedValue: undefined,
            numberValue: 423
        }])).toBe(',"numberValue":423');
        
        expect(helper.getNextChunk([{ 
            nullValue: null,
            undefinedValue: undefined,
            numberValue: 423
        }], true)).toBe('}]');

        expect(helper.getAllText()).toBe('[{"nullValue":null,"undefinedValue":null,"numberValue":423}]');
    });

    it('should handle boolean and number transitions', () => {
        const helper = new JsonStreamHelper();
        
        expect(helper.getNextChunk([{ 
            bool: true,
            num: 4
        }])).toBe('[{');

        expect(helper.getNextChunk([{ 
            bool: true,
            num: 42
        }])).toBe('"bool":true,"num":42');
        
        expect(helper.getNextChunk([{ 
            bool: true,
            num: 423
        }])).toBe('3');
        
        expect(helper.getNextChunk([{ 
            bool: true,
            num: 423
        }], true)).toBe('}]');

        expect(helper.getAllText()).toBe('[{"bool":true,"num":423}]');
    });
}); 