
// const jsonExampleOutputList = trimLines(`
// [
//     {
//         "name": "Michael",
//         "exactAge": 28,
//         "approximateAge": null,
//         "occupation": null,
//         "relationships": [
//             {
//                 "name": "Emily Raines",
//                 "relationship": "acquaintance"
//             },
//             {
//                 "name": "Emily Raines' boyfriend",
//                 "relationship": "acquaintance"
//             }
//         ],
//     },
//     {
//         "name": "Emily Raines",
//         "exactAge": null,
//         "approximateAge": "20s",
//         "occupation": "acute care nurse",
//         "relationships": [
//             {
//                 "name": "Michael",
//                 "relationship": "acquaintance"
//             },
//             {
//                 "name": "Emily Raines' boyfriend",
//                 "relationship": "boyfriend"
//             }
//         ]
//     }
// ]`);

// const ymlExampleOutputList = trimLines(`
//     - name: "Michael"
//       exactAge: 28
//       approximateAge: null
//       occupation: null
//       relationships:
//         - name: "Emily Raines"
//           relationship: "acquaintance"
//         - name: "Emily Raines' boyfriend"
//           relationship: "acquaintance"
//     - name: "Emily Raines"
//       exactAge: null
//       approximateAge: "20s"
//       occupation: "acute care nurse"
//       relationships:
//         - name: "Michael"
//           relationship: "acquaintance"
//         - name: "Emily Raines' boyfriend"
//           relationship: "boyfriend"
// `);

// const ORIGINAL_EXAMPLE = `
// # Example
// ## EXAMPLE INPUTS
// ### EXAMPLE INPUT DOCUMENTS
// <DOCUMENT_CONTENT>
// A 28-year old man named Michael can thank his lucky stars that when his heart stopped aboard an airplane, there was a healthcare angel sitting just a few rows back.

// Emily Raines, an acute care nurse in her 20s at a Baltimore hospital, was flying back from a vacation in the Bahamas with her boyfriend when the flight attendant asked if there was anyone onboard with medical training.

// Together they did chest compression, or CPR, for about 23 minutes before with just 7 minutes until landing, their good work revived the man.
// </DOCUMENT_CONTENT>
// ### EXAMPLE INPUT SCHEMA
// {
//     "type": "object",
//     "name": "Person",
//     "description": "A person",
//     "properties": {
//         "name": {
//             "type": "string",
//             "description": "The name of the person"
//         },
//         "exactAge": {
//             "type": "number",
//             "description": "The exact age of the person (null if unknown)"
//         },
//         "approximateAge": {
//             "type": "number",
//             "description": "The approximate age of the person (null if unknown)"
//         },
//         "occupation": {
//             "type": "string",
//             "description": "The occupation of the person (null if unknown)"
//         },
//         "relationships": {
//             "type": "array",
//             "description": "The relationships of the person (null if unknown)",
//             "items": {
//                 "type": "object",
//                 "properties": {
//                     "name": {
//                         "type": "string",
//                         "description": "The name of the person"
//                     },
//                     "relationship": {
//                         "type": "string",
//                         "description": "The relationship of the OTHER person to this person"
//                     }
//                 }
//             }
//         }
//     }
// }

// ## EXAMPLE OUTPUT MATCHING INPUT SCHEMA
// """
// ${
//   OUTPUT_FORMAT === "yaml"
//     ? ymlExampleOutputList
//     : jsonExampleOutputList
// }
// """
// `;

export default 1;