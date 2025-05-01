import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  AddtoUserSkillSetRoute,
} from "@/app/api/skills/add_to_user_skill_set/routeSchema";
import {
  Operation,
  SkillsReorganizeTreeRoute,
} from "@/app/api/skills/reorganize_tree/routeSchema";
import {useRsnUserId} from "@/clientOnly/hooks/useRsnUser";
import FractalTreeLoading from "@/components/icons/FractalTreeLoading";
import SkillAutocomplete, {
  AutocompleteSkill,
} from "@/components/skill/SkillAutocomplete";
import {SkillTreeV2} from "@/components/skill/SkillTreeV2/SkillTreeV2";
import {
  SkeletonWithOverlay,
} from "@/components/smart-skeleton/SkeletonWithOverlay";
import {Txt} from "@/components/typography/Txt";
import {useApolloClient} from "@apollo/client";
import {
  AddCircle,
  CheckCircle,
  LowPriority,
  OpenInNew,
} from "@mui/icons-material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Card,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Step,
  StepLabel,
  Stepper,
} from "@mui/material";
import {
  createActivityFlatMutDoc,
  createActivitySkillFlatMutDoc,
  createSkillFlatMutDoc,
  createSkillLinkFlatMutDoc,
  getSkillFlatQueryDoc,
} from "@reasonote/lib-sdk-apollo-client";

import {
  AnkiCard,
  AnkiDeck,
} from "../interfaces";

const ActivityChunkSize = 25;

export interface ImportApkgFileProps {
    decks: AnkiDeck[];
}

export const ImportApkgFile: React.FC<ImportApkgFileProps> = ({ decks }) => {
    const [activeStep, setActiveStep] = useState(0);
    const [organizeStep, setOrganizeStep] = useState(0);
    const [selectedDecks, setSelectedDecks] = useState<(string | number)[]>([]);
    const [selectedCards, setSelectedCards] = useState<{ [deckId: (string | number)]: (string | number)[] }>({});
    const [selectedSkills, setSelectedSkills] = useState<AutocompleteSkill[]>([]);
    const [skillsImportFinished, setSkillsImportFinished] = useState<AutocompleteSkill[]>([]);
    const [skillTreeState, setSkillTreeState] = useState<'waiting' | 'working' | 'finished' | 'error'>('waiting');
    const [skillTreeIterations, setSkillTreeIterations] = useState(0);
    const [skillTreeHistory, setSkillTreeHistory] = useState<Operation[]>([]);
    const [skillTreeTotalIterations, setSkillTreeTotalIterations] = useState(0);
    const rsnUserId = useRsnUserId();
    const listRef = useRef<HTMLUListElement>(null);
    const lastItemRef = useRef<any>(null);


    useEffect(() => {
        if (listRef.current) {
            lastItemRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [skillTreeHistory, skillTreeState]);

    const ac = useApolloClient();

    const handleDeckChange = (deckId: string | number) => {
        setSelectedDecks((prev) => {
            if (prev.includes(deckId)) {
                return prev.filter((id) => id !== deckId);
            } else {
                return [...prev, deckId];
            }
        });
    };

    const handleCardChange = (deckId: string | number, cardId: string | number) => {
        setSelectedCards((prev) => {
            const currentCards = prev[deckId] || [];
            if (currentCards.includes(cardId)) {
                return {
                    ...prev,
                    [deckId]: currentCards.filter((id) => id !== cardId),
                };
            } else {
                return {
                    ...prev,
                    [deckId]: [...currentCards, cardId],
                };
            }
        });
    };

    const handleNext = () => {
        if (activeStep === 1 && organizeStep === 0) {
            setOrganizeStep(1);
            handleSkillCreate();
        }
        else {
            setActiveStep((prevActiveStep) => prevActiveStep + 1);
        }
    };

    const handleBack = useCallback(() => {
        if (activeStep === 1 && organizeStep === 1) {
            setOrganizeStep(0);
        }
        else {
            setActiveStep((prevActiveStep) => prevActiveStep - 1);
        }
    }, [activeStep, organizeStep]);

    const handleSkillCreate = async () => {
        setSkillTreeState('working');
        const skillsAlreadyCreated = selectedSkills.filter((skill) => skill.id?.startsWith("skill_"));
        const skillIds = skillsAlreadyCreated
            .map((skill) => skill.id)
            .filter((id) => id !== null) as string[];
        const skillsToCreate = selectedSkills.filter(
            (skill) => !skillIds.includes(skill.id || "")
        );

        // Create skills that don't exist
        const skillsCreated = await AddtoUserSkillSetRoute.call({
            addSkills: skillsToCreate.map((skill) => ({ name: skill.name })),
        });

        const skillsCreatedIds = skillsCreated.data?.skillIds ?? [];
        skillIds.push(...skillsCreatedIds);

        // Fetch all the skillIds that were created
        const allSkillsResp = await ac.query({
            query: getSkillFlatQueryDoc,
            variables: {
                filter: {
                    id: {
                        in: skillIds,
                    },
                },
            },
        })

        // Now, go through our list of skills and change their ids to the actual ids
        setSelectedSkills((prev) => {
            return prev.map((skill) => {
                const theId = allSkillsResp.data?.skillCollection?.edges?.find((s) => s.node.name === skill.name)?.node.id;

                if (theId) {
                    return {
                        ...skill,
                        id: theId,
                    };
                }
                else {
                    console.error("Could not find skill id for skill", skill);
                    return skill;
                }
            });
        });


        // Now, update the selectedSkills state with the newly created skills
        setSkillsImportFinished((prev) => [
            ...skillsToCreate.map((skill, index) => ({
                id: skillsCreatedIds[index],
                name: skill.name,
            })),
            ...skillsAlreadyCreated
        ]);

        // Create a list of all selected cards
        const directlySelectedCards: { deckId: (string | number); card: AnkiCard }[] = [];
        Object.entries(selectedCards).forEach(([deckId, cardIds]) => {
            const deck = decks.find((d) => d.id === deckId);
            if (deck) {
                cardIds.forEach((cardId) => {
                    const card = deck.cards.find((c) => c.id === cardId);
                    if (card) {
                        directlySelectedCards.push({ deckId, card });
                    }
                });
            }
        });

        const cardsSelectedThroughDecks: { deckId: (string | number); card: AnkiCard }[] = selectedDecks
            .map((deckId) => decks.find((d) => d.id === deckId))
            .filter((deck): deck is AnkiDeck => deck !== undefined)
            .flatMap((deck) => deck.cards.map((card) => ({ deckId: deck.id, card })));

        const allSelectedCards = [...directlySelectedCards, ...cardsSelectedThroughDecks];

        // Create activities for all selected cards
        const createActivityRes = await ac.mutate({
            mutation: createActivityFlatMutDoc,
            variables: {
                objects: allSelectedCards.map((pair) => ({
                    name: "Anki Card",
                    type: "flashcard",
                    typeConfig: JSON.stringify({
                        type: "flashcard",
                        version: "0.0.0",
                        flashcardFront: pair.card.front,
                        flashcardBack: pair.card.back,
                    }),
                    metadata: JSON.stringify({
                        ankiDeckId: pair.deckId,
                    }),
                })),
            },
        });

        const createdActivityIds = createActivityRes.data?.insertIntoActivityCollection?.records?.map(
            (record) => record.id
        ) ?? [];

        // TODO: only one skill allowed for now.

        // Create skills for each activity (card)
        const skillsForCards = allSelectedCards.map(({ card }) => ({
            name: card.front,
            description: card.back,
        }));

        // Create skills for each card
        const createSkillsRes = await ac.mutate({
            mutation: createSkillFlatMutDoc,
            variables: {
                objects: skillsForCards.map((skill) => ({
                    name: skill.name,
                    description: skill.description,
                    // TODO: root skill handling needs to happen here -- a root skill should probably be created for the deck.
                })),
            }
        })

        const createdSkillIds = createSkillsRes.data?.insertIntoSkillCollection?.records?.map((r) => r.id) ?? [];


        // TODO: figure out which skill corresponds to which activity, by the typeConfig front


        // Create activity skills to link skills to their corresponding activities
        const activitySkillPairs = createdActivityIds.map((activityId, index) => ({
            activityId,
            skillId: createdSkillIds[index],
        }));

        await ac.mutate({
            mutation: createActivitySkillFlatMutDoc,
            variables: {
                objects: activitySkillPairs.map(({ activityId, skillId }) => ({
                    activity: activityId,
                    skill: skillId,
                    weight: 1, // Full weight since each skill corresponds directly to its activity
                })),
            },
        });

        // Create skill links to connect new skills to the parent skill
        const createSkillLinksRes = await ac.mutate({
            mutation: createSkillLinkFlatMutDoc,
            variables: {
                objects: createdSkillIds.map(skillId => ({
                    upstreamSkill: skillId,
                    downstreamSkill: skillIds[0], // Parent skill is downstream
                    metadata: JSON.stringify({
                        levelOnParent: "INTRO"
                    })
                })),
            },
        });

        if (createSkillLinksRes.errors) {
            console.error("Error creating skill links:", createSkillLinksRes.errors);
            setSkillTreeState('error');
            return;
        }

        setSkillTreeTotalIterations(4);

        for (var i = 0; i < 6; i++) {
            const reorgResult = await SkillsReorganizeTreeRoute.call({
                skillId: skillIds[0],
                userId: rsnUserId ?? ''
            })

            setSkillTreeHistory((prev) => [...prev, ...reorgResult.data?.operations ?? []]);

            setSkillTreeIterations((prev) => prev + 1);
        }

        setSkillTreeState('finished');


        return { skillIds, createdActivityIds }
    }


    // TODO: This should probably 
    const handleSubmit = async () => {
        handleNext();
    };

    const handleAccordionClick = (event: React.MouseEvent) => {
        event.stopPropagation();
    };

    const atLeastOneItemSelected = selectedDecks.length > 0 || Object.keys(selectedCards).length > 0;

    const steps = ["Select", "Organize", "Complete"];

    return (
        <Stack width={'100%'} height="100%" gap={2}>
            <Stepper activeStep={activeStep}>
                {steps.map((label) => (
                    <Step key={label}>
                        <StepLabel sx={{
                            '& .Mui-active': {
                                fontWeight: 'bold'
                            },
                        }}>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>
            {activeStep === 0 ? (
                <Stack gap={2}>
                    <Txt variant="body1">Select the decks and cards you want to import into Reasonote.</Txt>
                    <List>
                        {decks.map((deck) => (
                            <Accordion key={deck.id}>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={selectedDecks.includes(deck.id)}
                                                onChange={() => handleDeckChange(deck.id)}
                                                onClick={handleAccordionClick} // Prevents accordion expansion on checkbox click
                                            />
                                        }
                                        label={`${deck.name} (${deck.cards.length} cards)`}
                                        onClick={handleAccordionClick} // Prevents accordion expansion on label click
                                    />
                                </AccordionSummary>
                                <AccordionDetails sx={{ maxHeight: '300px', overflowY: 'auto' }}>
                                    <List disablePadding>
                                        {deck.cards.map((card) => (
                                            <ListItem key={card.id} disablePadding>
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            checked={selectedCards[deck.id]?.includes(card.id) || false}
                                                            onChange={() => handleCardChange(deck.id, card.id)}
                                                        />
                                                    }
                                                    label={
                                                        <ListItemText
                                                            primary={
                                                                <div style={{
                                                                    whiteSpace: 'pre-wrap',
                                                                    overflowWrap: 'break-word',
                                                                    wordBreak: 'break-word',
                                                                    hyphens: 'auto',
                                                                    maxWidth: '100%'
                                                                }}>
                                                                    {card.front}
                                                                </div>
                                                            }
                                                            secondary={
                                                                <div style={{
                                                                    whiteSpace: 'pre-wrap',
                                                                    overflowWrap: 'break-word',
                                                                    wordBreak: 'break-word',
                                                                    hyphens: 'auto',
                                                                    maxWidth: '100%'
                                                                }}>
                                                                    {card.back}
                                                                </div>
                                                            }
                                                        />
                                                    }
                                                    sx={{ width: '100%', margin: 0 }}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                </AccordionDetails>
                            </Accordion>
                        ))}
                    </List>
                    <Stack alignItems={"end"}>
                        <Button variant="contained" color="primary" onClick={handleNext} disabled={!atLeastOneItemSelected}>
                            Next
                        </Button>
                    </Stack>
                </Stack>
            ) : activeStep === 1 ? (
                organizeStep === 0 ? (
                    <Stack gap={2}>
                        <Txt>
                            What skills do you want to associate with the imported decks and cards?
                        </Txt>
                        <SkillAutocomplete
                            onCreateSkill={() => { }} onSkillsChange={setSelectedSkills}
                            initialSkills={selectedSkills ?? []}
                        />
                        <Stack justifyContent={"space-between"} direction={"row"}>
                            <Button onClick={handleBack}>Back</Button>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => {
                                    handleNext();
                                }}
                                disabled={selectedSkills.length === 0}
                            >
                                Next
                            </Button>
                        </Stack>
                    </Stack>
                ) : (
                    <Stack gap={2}>

                        <Stack gap={2}>
                            <Card sx={{ maxHeight: '300px', overflowY: 'auto' }} elevation={10}>
                                <SkillTreeV2 disableAddSkills disableDelete skillId={selectedSkills.map((skill) => skill.id)?.[0] ?? ''} refreshCount={skillTreeIterations} />
                            </Card>
                            <Card elevation={10}>
                                <List ref={listRef} sx={{ maxHeight: '200px', overflowY: 'auto' }} >
                                    {skillTreeHistory.map((operation, index) => (
                                        <ListItem key={index} >
                                            {
                                                operation.type === 'create' ?
                                                    (
                                                        <>
                                                            <ListItemIcon>
                                                                <AddCircle fontSize="small" color="gray" />
                                                            </ListItemIcon>
                                                            <ListItemText

                                                                secondary={`Created skill ${operation.newSkillName} on ${operation.parentName}...`}
                                                            />
                                                        </>
                                                    )
                                                    :
                                                    (
                                                        <>
                                                            <ListItemIcon>
                                                                <LowPriority fontSize="small" color="gray" />
                                                            </ListItemIcon>
                                                            <ListItemText
                                                                secondary={`Moved ${operation.skillNames.length} skills to ${operation.newParentName}...`}
                                                            />
                                                        </>

                                                    )
                                            }
                                        </ListItem>
                                    ))}
                                    {
                                        skillTreeState !== 'finished' ?
                                            <div ref={lastItemRef}>
                                                <SkeletonWithOverlay variant="rounded" width="100%" height="50px" >
                                                    <Txt startIcon={<div style={{ width: '30px', height: '30px' }}><FractalTreeLoading /></div>}>
                                                        {skillTreeIterations == 0 ? 'Creating' : 'Enhancing'} skill tree...</Txt>
                                                </SkeletonWithOverlay>
                                            </div>
                                            :
                                            <ListItem sx={{ width: '100%' }} ref={lastItemRef}>
                                                <ListItemIcon>
                                                    <CheckCircle fontSize="small" color="success" />
                                                </ListItemIcon>
                                                <ListItemText
                                                    sx={{ width: '100%' }}
                                                    secondary={`Skill tree created!`}
                                                />
                                            </ListItem>
                                    }
                                </List>
                            </Card>
                        </Stack>

                        {/* <BackNextText
                            backText="Back"
                            nextText="Finish"
                            onNext={handleSubmit}
                            onBack={handleBack}
                            centerText=""
                            nextDisabled={skillTreeState !== 'finished'}
                        /> */}

                    </Stack>
                )
            ) : (
                <Stack gap={2}>
                    <Txt>
                        The following skills have been added. Click on any skill to start studying it.
                    </Txt>
                    <List>
                        {skillsImportFinished.map((skill) => (
                            <ListItem button component="a" href={`/app/skills/${skill.id}?tab=learn`} key={skill.id}>
                                <ListItemIcon><OpenInNew /></ListItemIcon>
                                <ListItemText primary={skill.name} />
                            </ListItem>
                        ))}
                    </List>
                    <Button onClick={handleBack}>Back</Button>
                </Stack>
            )}
        </Stack>
    );
};