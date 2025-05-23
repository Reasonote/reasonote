import {makeServerApiHandlerV2} from "../../helpers/serverApiHandlerV2";
import {InterestsGetGenericInterestListRoute} from "./routeSchema";

// Tells next.js to set the maximum duration of the request to 30 seconds.
export const maxDuration = 30;

export const POST = makeServerApiHandlerV2({
    route: InterestsGetGenericInterestListRoute,
    handler: async (ctx) => {
        const { req, parsedReq,  supabase, logger, user } = ctx;

        return {
            interests: [
                {"emoji": "🎬", "name": "Movies"},
                {"emoji": "📚", "name": "Reading"},
                {"emoji": "⚽️", "name": "Sports"},
                {"emoji": "🍴", "name": "Food"},
                {"emoji": "🛍️", "name": "Shopping"},
                {"emoji": "🎮", "name": "Video games"},
                {"emoji": "🎵", "name": "Music"},
                {"emoji": "📱", "name": "Technology"},
                {"emoji": "🧩", "name": "Puzzles"},
                {"emoji": "🎭", "name": "Theater"},
                {"emoji": "🏠", "name": "Home improvement"},
                {"emoji": "👗", "name": "Fashion"},
                {"emoji": "🌳", "name": "Nature"},
                {"emoji": "📸", "name": "Photography"},
                {"emoji": "🌍", "name": "Travel"},
                {"emoji": "🎨", "name": "Art"},
                {"emoji": "🚗", "name": "Cars"},
                {"emoji": "📺", "name": "TV shows"},
                {"emoji": "🎭", "name": "Theater"},
                {"emoji": "📖", "name": "Books"},
                {"emoji": "🚶‍♀️", "name": "Hiking"},
                {"emoji": "🍻", "name": "Craft beer"},
                {"emoji": "🐾", "name": "Pets"},
                {"emoji": "🏃‍♂️", "name": "Running"},
                {"emoji": "🏋️‍♀️", "name": "Fitness"},
                {"emoji": "🤼‍♂️", "name": "Wrestling"},
                {"emoji": "🤹‍♀️", "name": "Dance"},
                {"emoji": "🎤", "name": "Karaoke"},
                {"emoji": "🧶", "name": "Knitting"},
                {"emoji": "🚣‍♀️", "name": "Rowing"},
                {"emoji": "🚲", "name": "Biking"},
                {"emoji": "🖌️", "name": "Drawing"},
                {"emoji": "📫", "name": "Writing"},
                {"emoji": "📱", "name": "Social media"},
                {"emoji": "🚀", "name": "Space"},
                {"emoji": "🏢", "name": "Business"},
                {"emoji": "🏠", "name": "Interior design"},
                {"emoji": "📚", "name": "Education"},
                {"emoji": "🖱️", "name": "Coding"},
                {"emoji": "🎓", "name": "Learning"},
                {"emoji": "💰", "name": "Finance"},
                {"emoji": "🚗", "name": "Cars"},
                {"emoji": "💄", "name": "Makeup"},
                {"emoji": "💇‍♀️", "name": "Hair"},
                {"emoji": "🌊", "name": "Swimming"},
                {"emoji": "🤽‍♀️", "name": "Water polo"},
                {"emoji": "⚽", "name": "Soccer"},
                {"emoji": "🏐", "name": "Volleyball"},
                {"emoji": "🏀", "name": "Basketball"},
                {"emoji": "🏒", "name": "Hockey"},
                {"emoji": "📚", "name": "Reading"},
                {"emoji": "🎬", "name": "Movies"},
                {"emoji": "🎵", "name": "Music"},
                {"emoji": "🎨", "name": "Art"},
                {"emoji": "🍳", "name": "Cooking"},
                {"emoji": "🌿", "name": "Gardening"},
                {"emoji": "🏋️", "name": "Fitness"},
                {"emoji": "🧘", "name": "Yoga"},
                {"emoji": "🚴", "name": "Cycling"},
                {"emoji": "🚣", "name": "Rowing"},
                {"emoji": "🎮", "name": "Video Games"},
                {"emoji": "🎲", "name": "Board Games"},
                {"emoji": "🎳", "name": "Bowling"},
                {"emoji": "🏂", "name": "Snowboarding"},
                {"emoji": "🏌️", "name": "Golf"},
                {"emoji": "🏄", "name": "Surfing"},
                {"emoji": "🧗", "name": "Rock Climbing"},
                {"emoji": "🏇", "name": "Horse Riding"},
                {"emoji": "🏕", "name": "Camping"},
                {"emoji": "🤿", "name": "Scuba Diving"},
                {"emoji": "🎾", "name": "Tennis"},
                {"emoji": "🎥", "name": "Film Making"},
                {"emoji": "🎻", "name": "Playing Musical Instruments"},
                {"emoji": "🎤", "name": "Singing"},
                {"emoji": "📸", "name": "Photography"},
                {"emoji": "✈️", "name": "Traveling"},
                {"emoji": "🎨", "name": "Painting"},
                {"emoji": "🖊️", "name": "Drawing"},
                {"emoji": "🐶", "name": "Pet Care"},
                {"emoji": "👟", "name": "Running"},
                {"emoji": "🛠️", "name": "DIY Projects"},
                {"emoji": "🧵", "name": "Sewing"},
                {"emoji": "🎨", "name": "Crafts"},
                {"emoji": "📝", "name": "Creative Writing"},
                {"emoji": "💻", "name": "Technology"},
                {"emoji": "🌍", "name": "Environmental Conservation"},
                {"emoji": "🔭", "name": "Astronomy"},
                {"emoji": "🎣", "name": "Fishing"},
                {"emoji": "🧩", "name": "Puzzles"},
                {"emoji": "🚗", "name": "Car Restoration"},
                {"emoji": "🐦", "name": "Bird Watching"},
                {"emoji": "📖", "name": "History"},
                {"emoji": "🏰", "name": "Architecture"},
                {"emoji": "🤖", "name": "Robotics"},
                {"emoji": "👗", "name": "Fashion"},
                {"emoji": "💄", "name": "Makeup"},
                {"emoji": "📈", "name": "Investing"},
                {"emoji": "📉", "name": "Stock Market"},
                {"emoji": "🧙", "name": "Role Playing Games"},
                {"emoji": "🎭", "name": "Theater"},
                {"emoji": "🕹️", "name": "Retro Gaming"},
                {"emoji": "🏢", "name": "Urban Exploration"},
                {"emoji": "👽", "name": "Science Fiction"},
                {"emoji": "📜", "name": "Classical Literature"},
                {"emoji": "🏞️", "name": "Nature Walks"},
                {"emoji": "🛹", "name": "Skateboarding"},
                {"emoji": "🛼", "name": "Roller Skating"},
                {"emoji": "🏒", "name": "Ice Hockey"},
                {"emoji": "🏀", "name": "Basketball"},
                {"emoji": "⚽", "name": "Football (Soccer)"},
                {"emoji": "🏉", "name": "Rugby"},
                {"emoji": "🏐", "name": "Volleyball"},
                {"emoji": "⚾", "name": "Baseball"},
                {"emoji": "🥊", "name": "Boxing"},
                {"emoji": "🥋", "name": "Martial Arts"},
                {"emoji": "🥌", "name": "Curling"},
                {"emoji": "🥏", "name": "Frisbee"},
                {"emoji": "🎾", "name": "Badminton"},
                {"emoji": "🥏", "name": "Disc Golf"},
                {"emoji": "🪂", "name": "Paragliding"},
                {"emoji": "🛶", "name": "Canoeing"},
                {"emoji": "🚴", "name": "Mountain Biking"},
                {"emoji": "🌐", "name": "Geocaching"},
                {"emoji": "🚀", "name": "Space Exploration"},
                {"emoji": "🌌", "name": "Cosmology"},
                {"emoji": "🔬", "name": "Microbiology"},
                {"emoji": "🧬", "name": "Genetics"},
                {"emoji": "🏛️", "name": "Archaeology"},
                {"emoji": "🎞️", "name": "Classic Movies"},
                {"emoji": "📻", "name": "Radio"},
                {"emoji": "🎸", "name": "Rock Music"},
                {"emoji": "🎷", "name": "Jazz Music"},
                {"emoji": "🎹", "name": "Classical Music"},
                {"emoji": "📰", "name": "Journalism"},
                {"emoji": "🎡", "name": "Amusement Parks"},
                {"emoji": "🏯", "name": "Cultural History"},
                {"emoji": "🎰", "name": "Gambling"},
                {"emoji": "🎢", "name": "Roller Coasters"},
                {"emoji": "🧳", "name": "Backpacking"},
                {"emoji": "🚆", "name": "Train Travel"},
                {"emoji": "🛳️", "name": "Cruise Travel"},
                {"emoji": "🧚", "name": "Fairy Tales"},
                {"emoji": "🕵️", "name": "Mystery and Suspense"},
                {"emoji": "🎙️", "name": "Podcasts"},
                {"emoji": "🖼️", "name": "Museums"},
                {"emoji": "🔖", "name": "Book Collecting"},
                {"emoji": "🦋", "name": "Butterfly Watching"},
                {"emoji": "🐌", "name": "Snail Keeping"},
                {"emoji": "🐠", "name": "Aquariums"},
                {"emoji": "🦴", "name": "Fossil Hunting"},
                {"emoji": "🎪", "name": "Circus Arts"},
                {"emoji": "🎤", "name": "Stand-up Comedy"},
                {"emoji": "🌐", "name": "Virtual Reality"},
                {"emoji": "👾", "name": "Augmented Reality"},
                {"emoji": "🛸", "name": "UFOlogy"},
                {"emoji": "🌼", "name": "Flower Arranging"},
                {"emoji": "🍷", "name": "Wine Tasting"},
                {"emoji": "🍽️", "name": "Gourmet Dining"},
                {"emoji": "🎨", "name": "Abstract Art"},
                {"emoji": "🏰", "name": "Medieval History"},
                {"emoji": "🌆", "name": "City Tours"},
                {"emoji": "🧪", "name": "Chemistry Experiments"},
                {"emoji": "🔨", "name": "Woodworking"},
                {"emoji": "⚙️", "name": "Mechanical Engineering"},
                {"emoji": "🧱", "name": "Lego Building"},
                {"emoji": "🛸", "name": "Drone Piloting"},
                {"emoji": "🕯️", "name": "Candle Making"},
                {"emoji": "🪑", "name": "Furniture Restoration"},
                {"emoji": "🔮", "name": "Tarot"},
                {"emoji": "👓", "name": "Philosophy"},
                {"emoji": "🎥", "name": "Documentary Films"},
                {"emoji": "👘", "name": "Kimono Collecting"},
                {"emoji": "🐉", "name": "Fantasy Literature"},
                {"emoji": "🧝", "name": "Elven Culture"},
                {"emoji": "🔥", "name": "Fire Dancing"},
                {"emoji": "🎠", "name": "Carousel Riding"},
                {"emoji": "🗿", "name": "Mythology"},
                {"emoji": "🎺", "name": "Brass Instruments"},
                {"emoji": "🎇", "name": "Fireworks"},
                {"emoji": "🎑", "name": "Festivals"},
                {"emoji": "🔍", "name": "Sleuthing"},
                {"emoji": "🛰️", "name": "Satellite Technology"},
                {"emoji": "💾", "name": "Retro Computing"},
                {"emoji": "📽️", "name": "Indie Films"},
                {"emoji": "📉", "name": "Economics"},
                {"emoji": "🚢", "name": "Shipbuilding"},
                {"emoji": "🏗️", "name": "Civil Engineering"},
                {"emoji": "🎪", "name": "Performance Art"},
                {"emoji": "🪖", "name": "Military History"},
                {"emoji": "🌋", "name": "Volcanology"},
                {"emoji": "🌪️", "name": "Storm Chasing"},
                {"emoji": "🔎", "name": "Investigative Reporting"},
                {"emoji": "📗", "name": "Self-help Books"},
                {"emoji": "💃", "name": "Dance"},
                {"emoji": "🏝️", "name": "Island Hopping"},
                {"emoji": "🎥", "name": "Action Films"},
                {"emoji": "📔", "name": "Notebook Collecting"},
                {"emoji": "🗺️", "name": "Map Making"},
                {"emoji": "🛤️", "name": "Railroad Modeling"},
                {"emoji": "🚍", "name": "Bus Spotting"},
                {"emoji": "🏎️", "name": "Racing"},
                {"emoji": "🎳", "name": "Pin Collecting"},
                {"emoji": "🎤", "name": "Karaoke"},
                {"emoji": "🔭", "name": "Telescope Making"},
                {"emoji": "🌌", "name": "Astrophotography"},
                {"emoji": "🎮", "name": "Esports"},
                {"emoji": "🧙", "name": "Magic Tricks"},
                {"emoji": "🚵", "name": "Trail Riding"},
                {"emoji": "🎵", "name": "Music"},
                {"emoji": "📚", "name": "Reading"},
                {"emoji": "🎬", "name": "Movies"},
                {"emoji": "🍳", "name": "Cooking"},
                {"emoji": "⚽", "name": "Football (Soccer)"},
                {"emoji": "🏋️", "name": "Fitness"},
                {"emoji": "🎮", "name": "Video Games"},
                {"emoji": "📸", "name": "Photography"},
                {"emoji": "🌿", "name": "Gardening"},
                {"emoji": "✈️", "name": "Traveling"},
                {"emoji": "💻", "name": "Technology"},
                {"emoji": "🎾", "name": "Tennis"},
                {"emoji": "🏀", "name": "Basketball"},
                {"emoji": "📺", "name": "Documentary Watching"},
                {"emoji": "🎨", "name": "Art"},
                {"emoji": "🏃", "name": "Running"},
                {"emoji": "🚴", "name": "Cycling"},
                {"emoji": "📘", "name": "Non-Fiction Books"},
                {"emoji": "🎻", "name": "Playing Musical Instruments"},
                {"emoji": "🍷", "name": "Wine Tasting"},
                {"emoji": "🧘", "name": "Yoga"},
                {"emoji": "🍽️", "name": "Gourmet Dining"},
                {"emoji": "🎲", "name": "Board Games"},
                {"emoji": "📚", "name": "Academic Writing"},
                {"emoji": "🔬", "name": "Biology"},
                {"emoji": "🎤", "name": "Singing"},
                {"emoji": "🏌️", "name": "Golf"},
                {"emoji": "🏂", "name": "Snowboarding"},
                {"emoji": "🎥", "name": "Film Making"},
                {"emoji": "📉", "name": "Investing"},
                {"emoji": "🏕", "name": "Camping"},
                {"emoji": "🧗", "name": "Rock Climbing"},
                {"emoji": "🧮", "name": "Mathematics"},
                {"emoji": "🌌", "name": "Physics"},
                {"emoji": "🧬", "name": "Biotechnology"},
                {"emoji": "💻", "name": "Computer Science"},
                {"emoji": "🎲", "name": "Gambling"},
                {"emoji": "🚣", "name": "Rowing"},
                {"emoji": "🏄", "name": "Surfing"},
                {"emoji": "🎳", "name": "Bowling"},
                {"emoji": "📐", "name": "Engineering"},
                {"emoji": "🚗", "name": "Car Restoration"},
                {"emoji": "🧵", "name": "Sewing"},
                {"emoji": "📝", "name": "Creative Writing"},
                {"emoji": "🎨", "name": "Painting"},
                {"emoji": "🖊️", "name": "Drawing"},
                {"emoji": "🐶", "name": "Pet Care"},
                {"emoji": "📈", "name": "Econometrics"},
                {"emoji": "📊", "name": "Data Science"},
                {"emoji": "🎤", "name": "Podcasts"},
                {"emoji": "🎮", "name": "Esports"},
                {"emoji": "🔭", "name": "Astronomy"},
                {"emoji": "🌍", "name": "Environmental Science"},
                {"emoji": "🏺", "name": "Antiquities Collecting"},
                {"emoji": "🔬", "name": "Chemistry"},
                {"emoji": "🧪", "name": "Chemistry Experiments"},
                {"emoji": "🔍", "name": "Ethnography"},
                {"emoji": "🌐", "name": "Linguistics"},
                {"emoji": "📜", "name": "Classical Literature"},
                {"emoji": "🏯", "name": "Cultural History"},
                {"emoji": "🏰", "name": "Architecture"},
                {"emoji": "🤖", "name": "Robotics"},
                {"emoji": "🎤", "name": "Stand-up Comedy"},
                {"emoji": "🔥", "name": "Startups"},
                {"emoji": "📈", "name": "Investing"},
                {"emoji": "🎭", "name": "Improv Comedy"},
                {"emoji": "📖", "name": "History"},
                {"emoji": "🎡", "name": "Amusement Parks"},
                {"emoji": "🎢", "name": "Roller Coasters"},
                {"emoji": "🧳", "name": "Backpacking"},
                {"emoji": "🚆", "name": "Train Travel"},
                {"emoji": "🛳️", "name": "Cruise Travel"},
                {"emoji": "🎮", "name": "Game Development"},
                {"emoji": "🎞️", "name": "Classic Movies"},
                {"emoji": "🎸", "name": "Rock Music"},
                {"emoji": "🎷", "name": "Jazz Music"},
                {"emoji": "🎹", "name": "Classical Music"},
                {"emoji": "🎙️", "name": "Broadcasting"},
                {"emoji": "🖼️", "name": "Museums"},
                {"emoji": "🔖", "name": "Book Collecting"},
                {"emoji": "🦋", "name": "Butterfly Watching"},
                {"emoji": "🐌", "name": "Snail Keeping"},
                {"emoji": "🐠", "name": "Aquariums"},
                {"emoji": "🦴", "name": "Fossil Hunting"},
                {"emoji": "🎪", "name": "Circus Arts"},
                {"emoji": "🎮", "name": "Retro Gaming"},
                {"emoji": "🧙", "name": "Role Playing Games"},
                {"emoji": "🎭", "name": "Theater"},
                {"emoji": "🧙", "name": "Magic Tricks"},
                {"emoji": "🌌", "name": "Cosmology"},
                {"emoji": "🧬", "name": "Genetics"},
                {"emoji": "🔬", "name": "Microbiology"},
                {"emoji": "🏛️", "name": "Archaeology"},
                {"emoji": "🚀", "name": "Space Exploration"}
            ]
        }
    }
})
