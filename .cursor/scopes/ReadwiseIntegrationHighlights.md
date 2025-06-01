# Readwise Integration & Highlights Feature - PRD

## Overview
This PRD outlines the implementation of a Readwise integration system that allows users to connect their Readwise account, sync their highlights, and view them within Reasonote. The feature includes automatic token validation, highlight synchronization, and a dedicated highlights viewing interface.

## Goals
1. **Integration Management**: Provide a user-friendly interface for managing Readwise API tokens
2. **Automatic Sync**: Implement background processing to sync highlights from Readwise
3. **Highlights Viewing**: Create a dedicated interface for viewing and managing highlights
4. **Permission System**: Ensure proper access control based on integration ownership
5. **Extensibility**: Design the system to support future integrations beyond Readwise

## User Stories

### Primary User Stories
1. **As a user**, I want to add my Readwise API token so I can sync my highlights to Reasonote
2. **As a user**, I want to see if my Readwise token is valid and when it was last synced
3. **As a user**, I want to view all my highlights in a dedicated interface
4. **As a user**, I want my highlights to be automatically synced in the background
5. **As a user**, I want to see which source (book, article, etc.) each highlight came from

### Secondary User Stories
1. **As a user**, I want to remove my Readwise integration if I no longer want to sync
2. **As a user**, I want to see sync status and any error messages
3. **As a user**, I want highlights to be searchable within Reasonote's vector search
4. **As a user**, I want to manually trigger an immediate sync of my highlights

## Technical Requirements

### Database Schema

#### New `highlight` Table
```sql
CREATE TABLE public.highlight (
    id text DEFAULT public.generate_typed_uuid('hlght') NOT NULL,
    content text NOT NULL,
    note text,
    location text, -- page number, chapter, etc.
    highlighted_at timestamp with time zone,
    tags text[], -- User-defined tags for organization
    
    -- Target references (one of these should be set)
    target_url text,
    target_snip_id text REFERENCES snip(id) ON DELETE CASCADE,
    target_rsn_page_id text REFERENCES rsn_page(id) ON DELETE CASCADE,
    
    -- Source information
    source_integration_id text REFERENCES integration(id) ON DELETE CASCADE,
    source_external_id text, -- Readwise highlight ID
    source_metadata jsonb, -- Book title, author, etc. (provider-agnostic)
    
    -- Standard audit fields
    created_date timestamp with time zone DEFAULT now() NOT NULL,
    updated_date timestamp with time zone DEFAULT now() NOT NULL,
    created_by text REFERENCES rsn_user(id) ON DELETE SET NULL,
    updated_by text REFERENCES rsn_user(id) ON DELETE SET NULL,
    
    CONSTRAINT highlight_pkey PRIMARY KEY (id),
    CONSTRAINT highlight__id__check_prefix CHECK (public.is_valid_typed_uuid('hlght', id::typed_uuid)),
    CONSTRAINT highlight_target_check CHECK (
        (target_url IS NOT NULL)::int + 
        (target_snip_id IS NOT NULL)::int + 
        (target_rsn_page_id IS NOT NULL)::int <= 1
    ),
    CONSTRAINT highlight_source_external_id_unique UNIQUE (source_integration_id, source_external_id)
);
```

#### Integration Table Updates
Add fields to existing `integration` table for sync management:
```sql
ALTER TABLE integration ADD COLUMN sync_in_progress_since timestamp with time zone;
ALTER TABLE integration ADD COLUMN sync_error text;
ALTER TABLE integration ADD COLUMN sync_error_count integer DEFAULT 0;
```

#### Permissions Strategy
Highlights are accessible to users who:
1. **Own the source integration** (`source_integration_id.for_user = current_user`)
2. **Own the target snip** (inherit permissions from target snip)
3. **Own the target page** (inherit permissions from target page)
4. **Created the highlight** (`created_by = current_user`)

This ensures highlights remain private to the appropriate user while supporting flexible targeting.

### API Routes

#### `/app/api/integrations/readwise/validate` (POST)
- **Purpose**: Validate a Readwise API token
- **Input**: `{ token: string }`
- **Output**: `{ valid: boolean, error?: string, userInfo?: object }`

#### `/app/api/integrations/readwise/setup` (POST)
- **Purpose**: Create or update Readwise integration
- **Input**: `{ token: string }`
- **Output**: `{ success: boolean, integrationId: string, error?: string }`

#### `/app/api/integrations/readwise/sync` (POST)
- **Purpose**: Manually trigger highlight sync by setting last_synced to null
- **Input**: `{ integrationId: string }`
- **Output**: `{ success: boolean, message: string, error?: string }`

#### `/app/api/highlights/list` (GET)
- **Purpose**: List user's highlights with pagination
- **Input**: Query params for filtering, pagination
- **Output**: Paginated list of highlights

### Frontend Pages

#### `/app/integrations` Page
- **Layout**: Similar to `/app/settings` with card-based sections
- **Sections**:
  - **Readwise Integration Card**
    - Token input field (password type)
    - Validation status indicator
    - Last sync timestamp
    - Manual sync button (triggers immediate sync)
    - Remove integration option
  - **Future integrations placeholder**

#### `/app/highlights` Page
- **Layout**: List view with infinite scroll (using `ACSBDefaultInfiniteScroll`)
- **Features**:
  - Search/filter functionality
  - Tag-based filtering and organization
  - Source grouping (by book, article, etc.)
  - Highlight content display
  - Notes display
  - Source metadata (book title, author, etc.)
  - Link to original source when available
  - Tag management (add/remove tags from highlights)

### Background Processing

#### Vector Worker Extension
Create new file: `bun_apps/vector-worker/src/readwise-sync.ts`

**Concurrent Async Loops Architecture**:
The readwise sync functionality will run as a separate async loop alongside the existing vector processing loop. Both loops will run concurrently using `Promise.all()`.

**File Organization**:
- `bun_apps/vector-worker/src/index.ts` - Main entry point, orchestrates both loops
- `bun_apps/vector-worker/src/vector-sync.ts` - Existing vector processing logic (extracted)
- `bun_apps/vector-worker/src/readwise-sync.ts` - New readwise sync logic

**Integration with Main Worker**:
Update `bun_apps/vector-worker/src/index.ts` to orchestrate both loops:

```typescript
// In bun_apps/vector-worker/src/index.ts
import { createClient } from '@supabase/supabase-js';
import { vectorSyncLoop } from './vector-sync';
import { readwiseSyncLoop } from './readwise-sync';
import type { VectorWorkerContext } from './types';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY || !process.env.SUPABASE_SERVICE_KEY) {
    throw new Error("SUPABASE_URL and SUPABASE_KEY and SUPABASE_SERVICE_KEY must be set");
}

// Custom logger function
function createCustomLogger(level: string) {
    return {
        debug: (...args: any[]) => level === 'debug' && console.debug(...args),
        info: (...args: any[]) => ['debug', 'info'].includes(level) && console.log(...args),
        warn: (...args: any[]) => ['debug', 'info', 'warn'].includes(level) && console.warn(...args),
        error: (...args: any[]) => console.error(...args),
        log: (...args: any[]) => console.log(...args),
    };
}

export async function main() {
    const logLevel = process.env.LOG_LEVEL || 'info';
    const ctx: VectorWorkerContext = {
        logger: createCustomLogger(logLevel),
        SUPERUSER_supabase: createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!),
    };

    ctx.logger.log('vector-worker started with concurrent processing');

    // Run both loops concurrently
    await Promise.all([
        vectorSyncLoop(ctx),
        readwiseSyncLoop(ctx)
    ]);
}

main().catch(console.error);
```

**Extract Vector Processing**:
Create new file: `bun_apps/vector-worker/src/vector-sync.ts`

```typescript
// In bun_apps/vector-worker/src/vector-sync.ts
import _ from 'lodash';
import { asyncSleep, notEmpty } from '@lukebechtel/lab-ts-utils';
import { createChunks } from './chunking';
import { vectorize_chunks } from './vectorize_chunks';
import type { VectorWorkerContext } from './types';

const NUM_ITEMS_POP_QUEUE = 50;
const SLEEP_TIME_MS = 1000;

export async function vectorSyncLoop(ctx: VectorWorkerContext) {
    ctx.logger.log('Vector processing loop started');
    
    while (true) {
        try {
            const dataResultVecQueue = await getVecQueue(ctx);

            if (dataResultVecQueue.length === 0) {
                ctx.logger.debug("No vecQueueItems found");
                await asyncSleep(SLEEP_TIME_MS);
                continue;
            }

            // ... rest of existing vector processing logic from main() ...
            // (move all the existing vector processing code here)
            
        } catch (error) {
            ctx.logger.error("Error in vector processing loop:", error);
        }
        
        await asyncSleep(SLEEP_TIME_MS);
    }
}

// Move existing getVecQueue and other vector processing functions here
async function getVecQueue(ctx: VectorWorkerContext) {
    // ... existing getVecQueue implementation ...
}
```

**Readwise Sync Loop**:
Create new file: `bun_apps/vector-worker/src/readwise-sync.ts`

```typescript
// In bun_apps/vector-worker/src/readwise-sync.ts
import { asyncSleep } from '@lukebechtel/lab-ts-utils';
import type { VectorWorkerContext } from './types';

const READWISE_SLEEP_TIME_MS = 5000; // Check every 5 seconds

export async function readwiseSyncLoop(ctx: VectorWorkerContext) {
    ctx.logger.log('Readwise sync loop started');
    
    while (true) {
        try {
            const syncedCount = await processReadwiseSync(ctx);
            
            if (syncedCount > 0) {
                ctx.logger.info(`Readwise: Synced ${syncedCount} integrations`);
            }
        } catch (error) {
            ctx.logger.error("Error in readwise sync loop:", error);
        }
        
        await asyncSleep(READWISE_SLEEP_TIME_MS);
    }
}

export async function processReadwiseSync(ctx: VectorWorkerContext): Promise<number> {
    // Implementation for readwise sync logic
    // Returns number of integrations synced
    return 0; // Placeholder
}
```

**Responsibilities**:
1. Poll for Readwise integrations that need syncing
2. Implement mutex-style locking to prevent concurrent syncs
3. Fetch highlights from Readwise API for selected integrations
4. Create/update highlight records
5. Handle rate limiting and error recovery
6. Update sync timestamps and clear locks

**Sync Process**:
1. Query for integrations with `_type = 'readwise'` that need syncing:
   - `last_synced` is NULL (immediate sync requested)
   - OR `last_synced` is older than sync interval (1 hour)
   - AND `sync_in_progress_since` is NULL or older than timeout (e.g., 30 minutes)
2. For each eligible integration, atomically set `sync_in_progress_since = now()`
3. Fetch highlights from Readwise API with pagination
4. Upsert highlights using `source_external_id` for deduplication
5. Update integration's `last_synced = now()` and clear `sync_in_progress_since = NULL`
6. Handle errors by updating `sync_error` and `sync_error_count`

**Mutex Implementation**:
```sql
-- Claim an integration for syncing
UPDATE integration 
SET sync_in_progress_since = now() 
WHERE id = $1 
  AND (sync_in_progress_since IS NULL OR sync_in_progress_since < now() - interval '30 minutes')
  AND (last_synced IS NULL OR last_synced < now() - interval '1 hour')
RETURNING id;
```

**Manual Sync Trigger**:
```sql
-- Trigger immediate sync by setting last_synced to null
UPDATE integration 
SET last_synced = NULL, sync_error = NULL, sync_error_count = 0
WHERE id = $1 AND for_user = $2;
```

### Integration with Existing Systems

#### Snip Integration
- When creating snips from Readwise highlights, link via `target_snip_id`
- Preserve connection to original Readwise source

## Implementation Plan

### Phase 1: Database & API Foundation
1. Create `highlight` table migration
2. Add sync management fields to `integration` table
3. Implement Readwise API validation route
4. Implement integration setup/management routes
5. Add RLS policies for highlight table

### Phase 2: Frontend Interfaces
1. Create `/app/integrations` page with Readwise section
2. Implement token validation UI
3. Create basic `/app/highlights` list page
4. Add integration management UI
5. Add manual sync button functionality

### Phase 3: Background Sync
1. Implement Readwise API client
2. Create sync worker with mutex-style locking
3. Add polling logic for integrations needing sync
4. Implement error handling and retry logic
5. Support immediate sync via last_synced = NULL

### Phase 4: Advanced Features
1. Implement highlight filtering and search
2. Add source metadata display
3. Add sync status monitoring and error display
4. Implement sync progress indicators

## Success Metrics
1. **User Adoption**: Number of users who successfully connect Readwise
2. **Sync Reliability**: Percentage of successful highlight syncs
3. **User Engagement**: Usage of highlights viewing page
4. **Sync Performance**: Average time between highlight creation in Readwise and appearance in Reasonote

## Risk Mitigation
1. **API Rate Limits**: Implement exponential backoff and respect Readwise rate limits
2. **Token Security**: Store tokens encrypted, provide clear revocation process
3. **Data Consistency**: Use upsert patterns to handle duplicate highlights
4. **Performance**: Implement pagination and lazy loading for large highlight collections
5. **Concurrent Sync Prevention**: Use database-level locking to prevent race conditions

## Future Considerations
1. **Additional Integrations**: Kindle, Instapaper, Pocket (keep integration design provider-agnostic)
2. **Highlight Annotations**: Allow users to add notes to synced highlights
3. **Export Features**: Allow users to export their highlights
4. **Collaboration**: Share highlights with other users or groups
5. **Vector Search**: Separate implementation for making highlights searchable
6. **Advanced Tagging**: Tag suggestions, tag hierarchies, bulk tag operations

## Technical Dependencies
- Readwise API documentation and rate limits
- Existing integration table structure (designed to be provider-agnostic)
- Vector worker infrastructure (for polling, not vector processing)
- Apollo Client for frontend data fetching
- Material-UI components for consistent styling

## Implementation Decisions Made
1. **No bidirectional sync**: Reasonote will not sync highlights back to Readwise
2. **Provider-agnostic design**: Integration system designed to support future providers
3. **Private highlights**: Accessible only to integration owner, target owner, or creator
4. **Hourly sync frequency**: Automatic sync every hour, with manual sync available
5. **Tag support**: Users can organize highlights with custom tags

## Next Steps
With all key decisions made, the implementation can proceed through the planned phases:

### **Phase 1: Database & API Foundation** (Ready to start)
- Create highlight table migration with tags field
- Add sync management fields to integration table
- Implement Readwise API validation and setup routes
- Add RLS policies for highlight permissions

### **Phase 2: Frontend Interfaces**
- Create /app/integrations page with Readwise management
- Build /app/highlights page with tag functionality
- Implement token validation and sync trigger UI

### **Phase 3: Background Sync**
- Extract vector processing to vector-sync.ts
- Implement readwise-sync.ts with hourly polling
- Add Readwise API client and highlight ingestion

### **Phase 4: Advanced Features**
- Tag management UI and filtering
- Source metadata display and organization
- Sync monitoring and error handling 