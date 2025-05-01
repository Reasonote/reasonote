import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {useRouter} from "next/navigation";

import {useIsOverLicenseLimit} from "@/clientOnly/hooks/useIsOverLicenseLimit";
import {useReasonoteLicense} from "@/clientOnly/hooks/useReasonoteLicense";
import {useResources} from "@/clientOnly/hooks/useResources";
import {useRsnUserId} from "@/clientOnly/hooks/useRsnUser";
import {
  notEmpty,
  trimLines,
  typedUuidV4,
} from "@lukebechtel/lab-ts-utils";
import {useSkillFlatFragLoader} from "@reasonote/lib-sdk-apollo-client-react";

import {useSupabase} from "../supabase/SupabaseProvider";
import {PodcastGenerationFormDumb} from "./PodcastGenerationFormDumb";

interface Document {
  id: string;
  name: string;
  body: string;
  wasCreated?: boolean;
}

export interface PodcastGenerationFormProps {
  skillPath?: string[];
  courseId?: string;
  initNumTurns?: number | null;
  initSpecialInstructions?: string;
  initPodcastType?: string;
  initDocuments?: Document[];
  overrideComponentTitle?: string;
  onAfterGenerate?: (podcastId: string) => void;
}

export function PodcastGenerationForm({
  skillPath,
  courseId,
  initNumTurns,
  initSpecialInstructions,
  initPodcastType,
  initDocuments,
  onAfterGenerate,
  overrideComponentTitle,
}: PodcastGenerationFormProps) {
  const userId = useRsnUserId();
  const [topic, setTopic] = useState('');
  const [documents, setDocuments] = useState<Document[]>(initDocuments ?? []);
  const [numTurns, setNumTurns] = useState<number | null>(initNumTurns ?? null);
  const [specialInstructions, setSpecialInstructions] = useState(trimLines(initSpecialInstructions ?? `
  - Be highly detailed, specific, and reference particular examples.
  - Don't chit-chat, just get to the point.
  - If papers are provided, assume that the user wants to learn about the topic from those papers.
  `));
  const [podcastType, setPodcastType] = useState(initPodcastType ?? 'layman-expert');
  const { sb } = useSupabase();
  const router = useRouter();

  const {data: subData, loading: isSubLoading} = useReasonoteLicense();

  const {data: isOverLimit, loading: isOverLimitLoading, refetch: refetchIsOverLimit} = useIsOverLicenseLimit('podcasts_generated');

  const lastSkillId = skillPath?.[skillPath.length - 1];

  const {data: skillFrag, loading: skillFragLoading} = useSkillFlatFragLoader(lastSkillId);

  const {data: resources, loading: isLoadingResources} = useResources({skills: skillPath ?? [], courseId: courseId})
  const [otherLoading, setOtherLoading] = useState(true);

  console.log('skillFrag: ', skillFrag, 'skillFragLoading: ', skillFragLoading);
  console.log('otherLoading: ', otherLoading);

  const docsFromSkill = useMemo(() => {
    return resources?.resourceCollection?.edges.map((edge) => {
      return {
        id: edge?.node?.id,
        name: edge?.node?.childPage?.name ?? '',
        body: edge?.node?.childPage?.body ?? ''
      }
    })
      .filter(notEmpty)
      .filter((d) => notEmpty(d.id));
  }, [resources]);

  // Load in everything for the skill we need.
  useEffect(() => {
    if (lastSkillId) {
      if (skillFrag){
        setTopic(skillFrag.name);
      }
      if (skillFrag && resources) {
        const docs = resources.resourceCollection?.edges.map((edge) => {
          return {
            id: edge?.node?.id ?? typedUuidV4('rsnpage'),
            name: edge?.node?.childPage?.name ?? '',
            body: edge?.node?.childPage?.body ?? ''
          }
        })

        setDocuments(docs ?? []);
        setOtherLoading(false);
      }
      else {
        setOtherLoading(false);
      }
    }
    else {
      setOtherLoading(false);
    }
  }, [skillFrag, resources, lastSkillId]);

  const onGenerate = useCallback(async () => {
    try {

        // Anything that was not in our init docs needs to be created as a rsn_page and then a resource, then joined to the podcast.
        const newDocs = documents.filter((doc) => !docsFromSkill?.some((ds) => ds.id === doc.id));

        const createdDocs = (await sb.from('rsn_page')
          .insert(newDocs.map((doc) => ({
              id: doc.id,
              _name: doc.name,
              body: doc.body,
            })
          ))
          .select('*')
        )?.data;

        const { data: podcast, error } = await sb.from('podcast').insert({
            title: `${topic}`,
            topic,
            podcast_type: podcastType,
            special_instructions: specialInstructions,
            for_skill_path: skillPath,
            // TODO: one-off docs are not correctly handled.
            metadata: {
                documents: documents.map(({ id, name }) => ({ id, name })),
            },
            for_user: userId,
        }).select().single();

        if (createdDocs && podcast) {
          const createdResourcesResp = await sb.from('resource')
            .insert(
              createdDocs.map((doc) => ({
                child_page_id: doc.id,
                parent_podcast_id:  podcast.id,
              }))
            )
            .select('*');
        }

        if (error) throw error;

        onAfterGenerate?.(podcast.id);
    } catch (error) {
        console.error('Error creating podcast:', error);
    }
  }, [sb, documents, initDocuments, topic, podcastType, specialInstructions, onAfterGenerate, userId, skillPath, docsFromSkill]);

  return <PodcastGenerationFormDumb 
    topic={topic}
    setTopic={setTopic}
    documents={documents}
    setDocuments={(setter) => {
      setDocuments((old) => {
        return setter(old)
          .map((doc) => {
            if (old.some((oldDoc) => oldDoc.id === doc.id)) {
              return doc;
            }
            else {
              return {
                ...doc,
                wasCreated: true,
              }
            }
          })
        })
    }}
    numTurns={numTurns}
    setNumTurns={setNumTurns}
    specialInstructions={specialInstructions}
    setSpecialInstructions={setSpecialInstructions}
    podcastType={podcastType}
    setPodcastType={setPodcastType}
    onGenerate={onGenerate}
    isLoading={skillFragLoading || otherLoading}
    isOverLimit={!!isOverLimit}
    licenseType={subData?.currentPlan?.type}
    overrideComponentTitle={overrideComponentTitle}
  />
}
    

