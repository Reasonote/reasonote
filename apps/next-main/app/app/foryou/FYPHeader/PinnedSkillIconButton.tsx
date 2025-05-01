import {useCallback} from "react";

import {FYPPinnedItems} from "../FYPTypes";
import {PinnedSkillIconButtonDumb} from "./PinnedSkillIconButtonDumb";

export interface PinnedSkillIconButtonProps {
    parentSkillIds?: string[];
    skillId: string;
    disabled?: boolean;
    pinned?: FYPPinnedItems;
    onPin?: (newPinPath: string[]) => void;
    onUnpin?: (newPinPath: string[]) => void;
}

export function PinnedSkillIconButton({skillId, disabled, parentSkillIds, pinned, onPin, onUnpin}: PinnedSkillIconButtonProps) {
    const pinState = pinned?.skillIdPath.includes(skillId) ?
        pinned.skillIdPath.indexOf(skillId) === pinned.skillIdPath.length - 1 ?
            'pinned-direct' : 'pinned-indirect'
        : undefined;

    const onUnpinCb = useCallback(() => {
        // Remove this, & everything after this in the skillIdPath.
        if (!pinned){
            console.warn("No pinned skillIdPath to unpin from", pinned);
            return;
        }

        console.log('onUnpinCb', pinned.skillIdPath);
        
        const index = pinned?.skillIdPath.indexOf(skillId);

        console.log('onUnpinCb', index);

        if (index === undefined || index === -1) {
            console.warn("Skill not found in pinned.skillIdPath", skillId, pinned?.skillIdPath);
            return;
        }

        console.log('onUnpinCb: full path', pinned.skillIdPath);
        console.log('onUnpinCb: index', index);
        console.log('onUnpinCb: path to unpin', pinned.skillIdPath.slice(0, index));

        const returning = pinned.skillIdPath.slice(0, index);

        console.log('onUnpinCb: returning', returning);

        onUnpin?.(returning);
    }, [pinned, skillId]);

    const onPinCb = () => {
        // Pin everything up to and including this skill from skillIdStack.
        // If there is no id, then do nothing.
        onPin?.([...(parentSkillIds ?? []), skillId]);
    }

    return <PinnedSkillIconButtonDumb
        onPin={onPinCb}
        onUnpin={onUnpinCb}
        disabled={disabled}
        pinState={pinState}
    />
}