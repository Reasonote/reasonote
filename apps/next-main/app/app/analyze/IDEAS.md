# Json object for representing diffs

## Text

```typescript
{
    path: (string | number)[],
    // Add: If this is an array, it is the array of added elements.
    type: 'add' | 'remove' | 'change',
}
```

## Number

## Array

### Add entry

```typescript
{
    path: (string | number)[],
    type: 'arr-insert',
    // The index of the new entry AFTER the insertion is performed.
    // Also allows for negative indexes.
    // To prepend, use index = 0.
    // To append, use index = -1.
    // I.e.:
    // > var A = [0, 2, 3]
    // > arrInsert(A, {index: 1, value: 1})
    // > console.log(A) // PRINTS [0, 1, 2, 3]
    index: number,
    // The value of the new entry.
    value: any,
}
```

## Object

### Add new field

```typescript
{
    path: (string | number)[],
    type: 'obj-insert',
    name: string,
    // The value of the new field.
    value: any,
}
```

### Remove field

```typescript
{
    path: (string | number)[],
    type: 'obj-remove',
}
```
