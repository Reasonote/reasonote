import {AnimatePresence} from "framer-motion";

import {
  FriendlyNotifierPopover,
} from "../notifications/FriendlyNotifierPopover";
import {
  FriendlyNotifierWrapper,
} from "../notifications/FriendlyNotifierWrapper";

export interface PodcastUpsellModalProps {
  isOverLimit: boolean;
  licenseType: string;
}

export function PodcastUpsellModal({ isOverLimit, licenseType }: PodcastUpsellModalProps) {
  return (
    <AnimatePresence>
        {isOverLimit && (
            <FriendlyNotifierWrapper 
                isVisible={!!isOverLimit}
                style={{
                    position: 'absolute',
                    left: 16,
                    right: 16,
                    bottom: 16,
                    top: 42,
                }}
            >
                <FriendlyNotifierPopover
                    title={licenseType === 'Reasonote-Anonymous' ? 'Keep Listening! 🎧' : "Let's Keep Listening!"}
                    illustration={'/images/illustrations/audio_conversation.svg'}
                    subtitle={
                        licenseType === 'Reasonote-Anonymous' 
                            ? "You're on a roll with our podcast generator!"
                            : "We're glad you're enjoying our podcast generator."
                    }
                    features={[
                        { icon: '🎧', label: 'More podcasts per day' },
                        { icon: '🎙️', label: 'More personalization options' },
                        { icon: '💖', label: '...and more!' }
                    ]}
                    licenseType={licenseType}
                />
            </FriendlyNotifierWrapper>
        )}
    </AnimatePresence>
  )
}