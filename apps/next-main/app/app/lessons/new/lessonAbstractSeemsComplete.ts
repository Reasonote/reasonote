import {
  SlowEmbeddingGroupRoute,
} from "@/app/api/internal/slow_embedding_group/routeSchema";
import {trimLines} from "@lukebechtel/lab-ts-utils";

export async function lessonAbstractSeemsComplete(lessonName: string, lessonDetails: string){
    function formatLesson(name: string, details: string){
        const nameLength = name.length < 4 ? 'short' : name.length < 10 ? 'medium' : 'long';
        const detailsLength = details.length < 20 ? 'short' : details.length < 40 ? 'medium' : 'long';

        return trimLines(
            `# Name (${nameLength})
            ${name} 
            # Details (${detailsLength})
            ${details}
            `
        )
    }
    
    const ret = await SlowEmbeddingGroupRoute.call({
        query: formatLesson(lessonName, lessonDetails),
        groups: [
            {
                groupId: 'complete',
                texts: [
                    formatLesson(
                        'Derivatives',
                        'Derivatives are the rate of change of a function. They are used in many areas of mathematics and science.'
                    ),
                    formatLesson(
                        'Music Theory',
                        'Music theory is the study of the practices and possibilities of music. It is derived from observation of, and involves the consideration of, music-making.'
                    ),
                    formatLesson(
                        'Physics',
                        'Physics is the natural science that studies matter, its motion and behavior through space and time, and the related entities of energy and force.'
                    ),
                    formatLesson(
                        'Biology',
                        'Biology is the natural science that studies life and living organisms, including their physical structure, chemical processes, molecular interactions, physiological mechanisms, development and evolution.'
                    ),
                    formatLesson(
                        'Chemistry',
                        'Chemistry is the scientific discipline involved with elements and compounds composed of atoms, molecules and ions: their composition, structure, properties, behavior and the changes they undergo during a reaction with other substances.'
                    ),
                    formatLesson(
                        'Dancing',
                        'Dancing is a performing art form consisting of purposefully selected sequences of human movement.'
                    ),
                    formatLesson(
                        'Dookie',
                        "Dookie is the third studio album by the American rock band Green Day, released on February 1, 1994, by Reprise Records. The band's major label debut, it was recorded in mid-1993 and is largely based around frontman Billie Joe Armstrong's personal experiences, with themes such as boredom, anxiety, relationships, and sexuality. After several years of grunge's dominance in popular music, the album brought a livelier, more melodic rock sound to the mainstream. Considered one of the defining albums of the 1990s and punk rock in general, Dookie was also pivotal in solidifying the genre's mainstream popularity. The album influenced a new wave of pop-punk bands, such as Blink-182, Sum 41, and Fall Out Boy. Though the band was labeled a sell-out by some of the band's original fans, the record received critical acclaim upon its release and won a Grammy Award for Best Alternative Music Album in 1995."
                    ),
                    formatLesson(
                        'Green Day',
                        'Calculus is the mathematical study of continuous change, in the same way that geometry is the study of shape and algebra is the study of generalizations of arithmetic operations.'
                    ),
                    formatLesson(
                        '77th British Academy Film Awards',
                        "The 77th British Academy Film Awards, more commonly known as the BAFTAs, were held on 18 February 2024, honouring the best national and foreign films of 2023, at the Royal Festival Hall within London's Southbank Centre. Presented by the British Academy of Film and Television Arts, accolades were handed out for the best feature-length film and documentaries of any nationality that were screened at British cinemas in 2023.[1][2][3][4][5][6]"

                    )
                ]
            },
            {
                groupId: 'incomplete',
                texts: [
                    formatLesson(
                        'Music Theory',
                        'Music'
                    ),
                    formatLesson(
                        'Quantum Mechan',
                        'The'
                    ),
                    formatLesson(
                        'Ad',
                        'No'
                    ),
                    formatLesson(
                        'asdlfkj',
                        'sdf'
                    ),
                    formatLesson(
                        'coool beans',
                        ''
                    ),
                    formatLesson(
                        'Calculus',
                        ''
                    ),
                    formatLesson(
                        'Physics',
                        ''
                    ),
                    formatLesson(
                        'Dancing',
                        ''
                    ),
                ]
            }
        ]
    });

    const completeScore = ret.data?.groupSimilarities.filter((sim) => sim.groupId === 'complete')[0].similarityScore;
    const incompleteScore = ret.data?.groupSimilarities.filter((sim) => sim.groupId === 'incomplete')[0].similarityScore;

    if (completeScore === undefined || incompleteScore === undefined){
        return false;
    }

    return completeScore > incompleteScore;
}