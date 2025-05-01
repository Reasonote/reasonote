import _ from "lodash";

// TODO: this needs to incorporate the idea of array prefixing and suffixing.
type Diffin = {
  path: (string | number)[];
  type: "item-set" | "item-add" | "item-delete";
  value?: any;
};

/**
 * Iterate over the objects, whatever type of object they are, recursively.
 * Build up a list of differences.
 * @param obj1
 * @param obj2
 * @param config
 */
export function GetDiffed(
  path: (string | number)[],
  oldItem: any,
  newItem: any,
  config?: {}
): Diffin[] {
  const ret: Diffin[] = [];

  if (_.isObject(oldItem)) {
    if (_.isObject(newItem)) {
      // Both objects, compare
      Object.entries(oldItem).forEach(([key, oldValue]) => {
        if (_.has(newItem, key)) {
          _.isEqual(oldItem, newItem);
        }
      });
    } else if (_.isArray(newItem)) {
      // Simple -- we set it to the new item.
      ret.push({
        path,
        type: "item-set",
        value: newItem,
      });
    }
  } else if (_.isArray(oldItem)) {
    if (_.isArray(newItem)) {
      // TODO:
      // BOTH ARRAYS, compare
    } else if (_.isObject(newItem)) {
      ret.push({
        path,
        type: "item-set",
        value: newItem,
      });
    }
  }

  return ret;
}
