import { graphql } from '../../codegen';

export const getMemberAuthorizationDeep = graphql(/* GraphQL */ `
query getMemberAuthorizationDeep($filter: MemberAuthorizationFilter, $orderBy: [MemberAuthorizationOrderBy!], $first: Int, $last: Int, $before: Cursor, $after: Cursor) {
    memberAuthorizationCollection(filter: $filter, orderBy: $orderBy, first: $first, last: $last, before: $before, after: $after) {
      pageInfo {
        ...PageInfoFlatFrag
      }
      edges {
        node {
          ...MemberAuthorizationFlatFrag
          bot {
            ...BotFlatFrag
          }
        }
      }
    }
  }
`);