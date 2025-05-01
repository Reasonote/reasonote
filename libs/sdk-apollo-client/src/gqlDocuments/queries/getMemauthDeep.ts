import { graphql } from '../../codegen';

export const getMemauthDeep = graphql(/* GraphQL */ `
query getMemauthDeep($filter: MemauthFilter, $orderBy: [MemauthOrderBy!], $first: Int, $last: Int, $before: Cursor, $after: Cursor) {
    memauthCollection(filter: $filter, orderBy: $orderBy, first: $first, last: $last, before: $before, after: $after) {
      pageInfo {
        ...PageInfoFlatFrag
      }
      edges {
        node {
          ...MemauthFlatFrag
          principalUser {
            ...RsnUserFlatFrag
          }
          principalBot {
            ...BotFlatFrag
          }
          principalGroup {
            ...GroupFlatFrag
          }
        }
      }
    }
  }
`);