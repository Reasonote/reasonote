import {ApolloClient} from "@apollo/client";
import {
  createUserSkillFlatMutDoc,
  updateUserSkillFlatMutDoc,
  UserSkillFilter,
  UserSkillInsertInput,
} from "@reasonote/lib-sdk-apollo-client";

export async function updateUserSkill(ac: ApolloClient<any>, filter: UserSkillFilter, data: UserSkillInsertInput){
    return await ac.mutate({
        mutation: updateUserSkillFlatMutDoc,
        variables: {
          filter: filter,
          set: data,
          atMost: 1
        }
      })
        .then(async (res) => {
          // If there were no results, then we need to create a new user skill.
          if (res.data?.updateUserSkillCollection.affectedCount === 0){
            await ac.mutate({
              mutation: createUserSkillFlatMutDoc,
              variables: {
                objects: [
                  data
                ]
              }
            })
              .then(() => {
                console.log(`Posted user skill to server.`);
              })
              .catch(() => {
                console.error(`Error posting user skill to server.`);
              })
          }
        })
        .catch(() => {
          console.error(`Error posting user skill to server.`);
        })
}