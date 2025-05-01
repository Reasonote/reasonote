export interface SimpleSkill {
    name: string;
    description?: string | null;
  }
  
  export interface SimpleSkillWithId extends SimpleSkill {
    id: string;
  }
  
  export enum SkillTypeEnum {
    ShouldBeIdentical = 'ShouldBeIdentical',
    ShouldBeSimilar = 'ShouldBeSimilar',
    ShouldBeDifferent = 'ShouldBeDifferent',
  }
  
  
  interface DatasetSkillEntry {
    skillOne: SimpleSkill;
    skillTwo: SimpleSkill;
    type: SkillTypeEnum;
  }
  
  export interface DatasetSkillEntryWithIds {
    skillOne: SimpleSkillWithId;
    skillTwo: SimpleSkillWithId;
    type: SkillTypeEnum;
  }
  
  // DATASET
  export const skillListing: DatasetSkillEntry[] = [
    {
        type: SkillTypeEnum.ShouldBeIdentical,
        skillOne: {
          name: 'Calculus'
        },
        skillTwo: {
          name: 'Calculus',
        },
    },
    {
      type: SkillTypeEnum.ShouldBeIdentical,
      skillOne: {
        name: 'Calculus',
        description: "Calculus!"
      },
      skillTwo: {
        name: 'Calculus',
        description: "Calculus!!!"
      },
    },
    {
      type: SkillTypeEnum.ShouldBeIdentical,
      skillOne: {
        name: 'Calculus',
        description: 'Calculus is the study of change.',
      },
      skillTwo: {
        name: 'Calculus',
        description: 'Calculus is the study of rates of change.',
      },
    },
    {
      type: SkillTypeEnum.ShouldBeDifferent,
      skillOne: {
        name: 'Differentiation',
        description: 'Differentiation is a technique for solving derivatives.',
      },
      skillTwo: {
        name: 'Integration',
        description: 'Integration is a technique for solving integrals.',
      },
    },

    {
      type: SkillTypeEnum.ShouldBeIdentical,
      skillOne: {
        name: 'Civil War',
        description: 'The Civil War was a war fought in the United States.',
      },
      skillTwo: {
        name: 'War, The Civil',
        description: '"The Civil War" was fought in the United States., and was a war between the North and the South.',
      },
    },
    
    {
      type: SkillTypeEnum.ShouldBeDifferent,
      skillOne: { name: 'Functional Programming', description: 'A paradigm that treats computation as the evaluation of mathematical functions.' },
      skillTwo: { name: 'Procedural Programming', description: 'A paradigm based on the concept of procedure calls.' },
    },

    {
      type: SkillTypeEnum.ShouldBeDifferent,
      skillOne: { name: 'Machine Learning', description: 'A field of AI that focuses on data-driven algorithms.' },
      skillTwo: { name: 'Deep Learning', description: 'A subset of ML based on artificial neural networks.' },
    },

    {
      type: SkillTypeEnum.ShouldBeDifferent,
      skillOne: { name: 'HTML', description: 'A markup language for creating web pages.' },
      skillTwo: { name: 'CSS', description: 'A style sheet language used for describing the presentation of a document.' },
    },

    {
      type: SkillTypeEnum.ShouldBeDifferent,
      skillOne: { name: 'SQL', description: 'A domain-specific language used in programming for managing relational databases.' },
      skillTwo: { name: 'NoSQL', description: 'A mechanism for storage and retrieval of data, used mainly for distributed data stores.' },
    },

    {
      type: SkillTypeEnum.ShouldBeDifferent,
      skillOne: { name: 'Data Analysis', description: 'The process of inspecting, cleansing, and modeling data.' },
      skillTwo: { name: 'Data Mining', description: 'The process of discovering patterns in large data sets.' },
    }



    /////////////////////////////////////////////////////////////////



    // {
    //   type: SkillTypeEnum.ShouldBeIdentical,
    //   skillOne: { name: 'Object-Oriented Programming', description: 'A paradigm based on the concept of objects.' },
    //   skillTwo: { name: 'OOP', description: 'Programming with objects and classes.' },
    // },

    // {
    //   type: SkillTypeEnum.ShouldBeIdentical,
    //   skillOne: { name: 'Python', description: 'A high-level, interpreted programming language.' },
    //   skillTwo: { name: 'Python Language', description: 'A versatile programming language known for its readability.' },
    // },
    // {
    //   type: SkillTypeEnum.ShouldBeIdentical,
    //   skillOne: { name: 'Git', description: 'A distributed version-control system.' },
    //   skillTwo: { name: 'Git VCS', description: 'A system for tracking changes in source code during software development.' },
    // },
    // {
    //   type: SkillTypeEnum.ShouldBeIdentical,
    //   skillOne: { name: 'Agile Software Development', description: 'An approach to software development under which requirements and solutions evolve.' },
    //   skillTwo: { name: 'Agile Methodology', description: 'A set of principles for software development in which requirements and solutions evolve through collaborative effort.' },
    // },
    // {
    //   type: SkillTypeEnum.ShouldBeIdentical,
    //   skillOne: { name: 'JavaScript', description: 'A scripting language for web development.' },
    //   skillTwo: { name: 'JS', description: 'Short for JavaScript, used in web development.' },
    // },
    // {
    //   type: SkillTypeEnum.ShouldBeIdentical,
    //   skillOne: {
    //     name: 'Calculus',
    //     description: 'Calculus is the study of change.',
    //   },
    //   skillTwo: {
    //     name: 'Calculus',
    //     description: 'Calculus, invented by Newton and Leibniz, is the study of change.',
    //   },
    // },
    // {
    //   type: SkillTypeEnum.ShouldBeIdentical,
    //   skillOne: {
    //     name: 'Integration by Parts',
    //     description: 'Integration by parts is a technique for solving integrals.',
    //   },
    //   skillTwo: {
    //     name: 'Integration Using Parts',
    //     description: 'Integration Using parts is a method for arriving at solutions to integrals.',
    //   },
    // },
    // {
    //   type: SkillTypeEnum.ShouldBeDifferent,
    //   skillOne: {
    //     name: 'Integration by Parts',
    //     description: 'Integration by parts is a technique for solving integrals.',
    //   },
    //   skillTwo: {
    //     name: 'Integration by Substitution',
    //     description: 'Integration by substitution is a technique for solving integrals.',
    //   },
    // },
    // {
    //   type: SkillTypeEnum.ShouldBeDifferent,
    //   skillOne: {
    //     name: 'Civil War',
    //     description: 'The Civil War was a war fought in the United States.',
    //   },
    //   skillTwo: {
    //     name: 'World War II',
    //     description: 'World War II was a war fought in Europe.',
    //   },
    // },
]