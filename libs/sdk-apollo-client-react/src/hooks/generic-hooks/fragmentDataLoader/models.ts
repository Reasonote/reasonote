import { DefinitionNode, OperationDefinitionNode } from "graphql";

export function isOperationDefinitionNode(node: DefinitionNode): node is OperationDefinitionNode {
    return node.kind === "OperationDefinition";
}
