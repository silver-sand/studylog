export interface SyllabusChapter {
  examType: string;
  subject: string;
  chapter: string;
  classLevel?: '11' | '12';
  sortOrder: number;
}

export const EXAM_SYLLABI: SyllabusChapter[] = [
  // ═══════════════════════════════════════════
  // JEE MAIN
  // ═══════════════════════════════════════════

  // ── Physics Class 11 ──
  { examType: 'JEE', subject: 'Physics', chapter: 'Units and Measurements', classLevel: '11', sortOrder: 1 },
  { examType: 'JEE', subject: 'Physics', chapter: 'Kinematics', classLevel: '11', sortOrder: 2 },
  { examType: 'JEE', subject: 'Physics', chapter: 'Laws of Motion', classLevel: '11', sortOrder: 3 },
  { examType: 'JEE', subject: 'Physics', chapter: 'Work, Energy and Power', classLevel: '11', sortOrder: 4 },
  { examType: 'JEE', subject: 'Physics', chapter: 'Rotational Motion', classLevel: '11', sortOrder: 5 },
  { examType: 'JEE', subject: 'Physics', chapter: 'Gravitation', classLevel: '11', sortOrder: 6 },
  { examType: 'JEE', subject: 'Physics', chapter: 'Properties of Solids and Liquids', classLevel: '11', sortOrder: 7 },
  { examType: 'JEE', subject: 'Physics', chapter: 'Thermodynamics', classLevel: '11', sortOrder: 8 },
  { examType: 'JEE', subject: 'Physics', chapter: 'Kinetic Theory of Gases', classLevel: '11', sortOrder: 9 },
  { examType: 'JEE', subject: 'Physics', chapter: 'Oscillations and Waves', classLevel: '11', sortOrder: 10 },

  // ── Physics Class 12 ──
  { examType: 'JEE', subject: 'Physics', chapter: 'Electrostatics', classLevel: '12', sortOrder: 11 },
  { examType: 'JEE', subject: 'Physics', chapter: 'Current Electricity', classLevel: '12', sortOrder: 12 },
  { examType: 'JEE', subject: 'Physics', chapter: 'Magnetic Effects of Current and Magnetism', classLevel: '12', sortOrder: 13 },
  { examType: 'JEE', subject: 'Physics', chapter: 'Electromagnetic Induction and Alternating Currents', classLevel: '12', sortOrder: 14 },
  { examType: 'JEE', subject: 'Physics', chapter: 'Electromagnetic Waves', classLevel: '12', sortOrder: 15 },
  { examType: 'JEE', subject: 'Physics', chapter: 'Optics', classLevel: '12', sortOrder: 16 },
  { examType: 'JEE', subject: 'Physics', chapter: 'Dual Nature of Matter and Radiation', classLevel: '12', sortOrder: 17 },
  { examType: 'JEE', subject: 'Physics', chapter: 'Atoms and Nuclei', classLevel: '12', sortOrder: 18 },
  { examType: 'JEE', subject: 'Physics', chapter: 'Electronic Devices', classLevel: '12', sortOrder: 19 },
  { examType: 'JEE', subject: 'Physics', chapter: 'Communication Systems', classLevel: '12', sortOrder: 20 },
  { examType: 'JEE', subject: 'Physics', chapter: 'Experimental Skills', classLevel: '12', sortOrder: 21 },

  // ── Chemistry Class 11 ──
  { examType: 'JEE', subject: 'Chemistry', chapter: 'Some Basic Concepts of Chemistry', classLevel: '11', sortOrder: 1 },
  { examType: 'JEE', subject: 'Chemistry', chapter: 'States of Matter', classLevel: '11', sortOrder: 2 },
  { examType: 'JEE', subject: 'Chemistry', chapter: 'Atomic Structure', classLevel: '11', sortOrder: 3 },
  { examType: 'JEE', subject: 'Chemistry', chapter: 'Chemical Bonding and Molecular Structure', classLevel: '11', sortOrder: 4 },
  { examType: 'JEE', subject: 'Chemistry', chapter: 'Thermodynamics', classLevel: '11', sortOrder: 5 },
  { examType: 'JEE', subject: 'Chemistry', chapter: 'Equilibrium', classLevel: '11', sortOrder: 6 },
  { examType: 'JEE', subject: 'Chemistry', chapter: 'Redox Reactions', classLevel: '11', sortOrder: 7 },
  { examType: 'JEE', subject: 'Chemistry', chapter: 'Classification of Elements and Periodicity', classLevel: '11', sortOrder: 8 },
  { examType: 'JEE', subject: 'Chemistry', chapter: 'Hydrogen', classLevel: '11', sortOrder: 9 },
  { examType: 'JEE', subject: 'Chemistry', chapter: 's-Block and p-Block Elements', classLevel: '11', sortOrder: 10 },
  { examType: 'JEE', subject: 'Chemistry', chapter: 'Environmental Chemistry', classLevel: '11', sortOrder: 11 },

  // ── Chemistry Class 12 ──
  { examType: 'JEE', subject: 'Chemistry', chapter: 'Solid State', classLevel: '12', sortOrder: 12 },
  { examType: 'JEE', subject: 'Chemistry', chapter: 'Solutions', classLevel: '12', sortOrder: 13 },
  { examType: 'JEE', subject: 'Chemistry', chapter: 'Electrochemistry', classLevel: '12', sortOrder: 14 },
  { examType: 'JEE', subject: 'Chemistry', chapter: 'Chemical Kinetics', classLevel: '12', sortOrder: 15 },
  { examType: 'JEE', subject: 'Chemistry', chapter: 'Surface Chemistry', classLevel: '12', sortOrder: 16 },
  { examType: 'JEE', subject: 'Chemistry', chapter: 'd- and f-Block Elements', classLevel: '12', sortOrder: 17 },
  { examType: 'JEE', subject: 'Chemistry', chapter: 'Coordination Compounds', classLevel: '12', sortOrder: 18 },
  { examType: 'JEE', subject: 'Chemistry', chapter: 'General Principles of Isolation of Elements', classLevel: '12', sortOrder: 19 },
  { examType: 'JEE', subject: 'Chemistry', chapter: 'Haloalkanes and Haloarenes', classLevel: '12', sortOrder: 20 },
  { examType: 'JEE', subject: 'Chemistry', chapter: 'Alcohols, Phenols and Ethers', classLevel: '12', sortOrder: 21 },
  { examType: 'JEE', subject: 'Chemistry', chapter: 'Aldehydes, Ketones and Carboxylic Acids', classLevel: '12', sortOrder: 22 },
  { examType: 'JEE', subject: 'Chemistry', chapter: 'Amines', classLevel: '12', sortOrder: 23 },
  { examType: 'JEE', subject: 'Chemistry', chapter: 'Polymers', classLevel: '12', sortOrder: 24 },
  { examType: 'JEE', subject: 'Chemistry', chapter: 'Biomolecules', classLevel: '12', sortOrder: 25 },
  { examType: 'JEE', subject: 'Chemistry', chapter: 'Chemistry in Everyday Life', classLevel: '12', sortOrder: 26 },

  // ── Mathematics Class 11 ──
  { examType: 'JEE', subject: 'Mathematics', chapter: 'Sets, Relations and Functions', classLevel: '11', sortOrder: 1 },
  { examType: 'JEE', subject: 'Mathematics', chapter: 'Trigonometry', classLevel: '11', sortOrder: 2 },
  { examType: 'JEE', subject: 'Mathematics', chapter: 'Complex Numbers and Quadratic Equations', classLevel: '11', sortOrder: 3 },
  { examType: 'JEE', subject: 'Mathematics', chapter: 'Permutations and Combinations', classLevel: '11', sortOrder: 4 },
  { examType: 'JEE', subject: 'Mathematics', chapter: 'Binomial Theorem', classLevel: '11', sortOrder: 5 },
  { examType: 'JEE', subject: 'Mathematics', chapter: 'Sequence and Series', classLevel: '11', sortOrder: 6 },
  { examType: 'JEE', subject: 'Mathematics', chapter: 'Straight Lines and Conic Sections', classLevel: '11', sortOrder: 7 },
  { examType: 'JEE', subject: 'Mathematics', chapter: 'Mathematical Reasoning', classLevel: '11', sortOrder: 8 },
  { examType: 'JEE', subject: 'Mathematics', chapter: 'Statistics and Probability', classLevel: '11', sortOrder: 9 },

  // ── Mathematics Class 12 ──
  { examType: 'JEE', subject: 'Mathematics', chapter: 'Relations and Functions (Advanced)', classLevel: '12', sortOrder: 10 },
  { examType: 'JEE', subject: 'Mathematics', chapter: 'Inverse Trigonometric Functions', classLevel: '12', sortOrder: 11 },
  { examType: 'JEE', subject: 'Mathematics', chapter: 'Matrices and Determinants', classLevel: '12', sortOrder: 12 },
  { examType: 'JEE', subject: 'Mathematics', chapter: 'Continuity, Differentiability and Limits', classLevel: '12', sortOrder: 13 },
  { examType: 'JEE', subject: 'Mathematics', chapter: 'Application of Derivatives', classLevel: '12', sortOrder: 14 },
  { examType: 'JEE', subject: 'Mathematics', chapter: 'Integrals and Differential Equations', classLevel: '12', sortOrder: 15 },
  { examType: 'JEE', subject: 'Mathematics', chapter: 'Vector Algebra', classLevel: '12', sortOrder: 16 },
  { examType: 'JEE', subject: 'Mathematics', chapter: 'Three-Dimensional Geometry', classLevel: '12', sortOrder: 17 },
  { examType: 'JEE', subject: 'Mathematics', chapter: 'Probability (Advanced)', classLevel: '12', sortOrder: 18 },

  // ═══════════════════════════════════════════
  // NEET
  // ═══════════════════════════════════════════

  // ── Physics ──
  { examType: 'NEET', subject: 'Physics', chapter: 'Physics and Measurement', sortOrder: 1 },
  { examType: 'NEET', subject: 'Physics', chapter: 'Kinematics', sortOrder: 2 },
  { examType: 'NEET', subject: 'Physics', chapter: 'Laws of Motion', sortOrder: 3 },
  { examType: 'NEET', subject: 'Physics', chapter: 'Work, Energy and Power', sortOrder: 4 },
  { examType: 'NEET', subject: 'Physics', chapter: 'Rotational Motion', sortOrder: 5 },
  { examType: 'NEET', subject: 'Physics', chapter: 'Gravitation', sortOrder: 6 },
  { examType: 'NEET', subject: 'Physics', chapter: 'Properties of Solids and Liquids', sortOrder: 7 },
  { examType: 'NEET', subject: 'Physics', chapter: 'Thermodynamics', sortOrder: 8 },
  { examType: 'NEET', subject: 'Physics', chapter: 'Kinetic Theory of Gases', sortOrder: 9 },
  { examType: 'NEET', subject: 'Physics', chapter: 'Oscillations and Waves', sortOrder: 10 },
  { examType: 'NEET', subject: 'Physics', chapter: 'Electrostatics', sortOrder: 11 },
  { examType: 'NEET', subject: 'Physics', chapter: 'Current Electricity', sortOrder: 12 },
  { examType: 'NEET', subject: 'Physics', chapter: 'Magnetic Effects of Current and Magnetism', sortOrder: 13 },
  { examType: 'NEET', subject: 'Physics', chapter: 'Electromagnetic Induction and Alternating Current', sortOrder: 14 },
  { examType: 'NEET', subject: 'Physics', chapter: 'Electromagnetic Waves', sortOrder: 15 },
  { examType: 'NEET', subject: 'Physics', chapter: 'Optics', sortOrder: 16 },
  { examType: 'NEET', subject: 'Physics', chapter: 'Dual Nature of Matter and Radiation', sortOrder: 17 },
  { examType: 'NEET', subject: 'Physics', chapter: 'Atoms and Nuclei', sortOrder: 18 },
  { examType: 'NEET', subject: 'Physics', chapter: 'Electronic Devices', sortOrder: 19 },
  { examType: 'NEET', subject: 'Physics', chapter: 'Experimental Skills', sortOrder: 20 },

  // ── Chemistry ──
  { examType: 'NEET', subject: 'Chemistry', chapter: 'Some Basic Concepts of Chemistry', sortOrder: 1 },
  { examType: 'NEET', subject: 'Chemistry', chapter: 'Atomic Structure', sortOrder: 2 },
  { examType: 'NEET', subject: 'Chemistry', chapter: 'Chemical Bonding and Molecular Structure', sortOrder: 3 },
  { examType: 'NEET', subject: 'Chemistry', chapter: 'Chemical Thermodynamics', sortOrder: 4 },
  { examType: 'NEET', subject: 'Chemistry', chapter: 'Solutions', sortOrder: 5 },
  { examType: 'NEET', subject: 'Chemistry', chapter: 'Equilibrium', sortOrder: 6 },
  { examType: 'NEET', subject: 'Chemistry', chapter: 'Redox Reactions and Electrochemistry', sortOrder: 7 },
  { examType: 'NEET', subject: 'Chemistry', chapter: 'Chemical Kinetics', sortOrder: 8 },
  { examType: 'NEET', subject: 'Chemistry', chapter: 'Classification of Elements', sortOrder: 9 },
  { examType: 'NEET', subject: 'Chemistry', chapter: 'p-Block Elements (Groups 13-18)', sortOrder: 10 },
  { examType: 'NEET', subject: 'Chemistry', chapter: 'd- and f-Block Elements', sortOrder: 11 },
  { examType: 'NEET', subject: 'Chemistry', chapter: 'Coordination Compounds', sortOrder: 12 },
  { examType: 'NEET', subject: 'Chemistry', chapter: 'Purification and Characterisation', sortOrder: 13 },
  { examType: 'NEET', subject: 'Chemistry', chapter: 'Some Basic Principles of Organic Chemistry', sortOrder: 14 },
  { examType: 'NEET', subject: 'Chemistry', chapter: 'Hydrocarbons', sortOrder: 15 },
  { examType: 'NEET', subject: 'Chemistry', chapter: 'Organic Compounds Containing Halogens', sortOrder: 16 },
  { examType: 'NEET', subject: 'Chemistry', chapter: 'Organic Compounds Containing Oxygen', sortOrder: 17 },
  { examType: 'NEET', subject: 'Chemistry', chapter: 'Organic Compounds Containing Nitrogen', sortOrder: 18 },
  { examType: 'NEET', subject: 'Chemistry', chapter: 'Biomolecules', sortOrder: 19 },
  { examType: 'NEET', subject: 'Chemistry', chapter: 'Principles Related to Practical Chemistry', sortOrder: 20 },

  // ── Biology ──
  { examType: 'NEET', subject: 'Biology', chapter: 'Diversity in Living World', sortOrder: 1 },
  { examType: 'NEET', subject: 'Biology', chapter: 'Structural Organisation in Plants and Animals', sortOrder: 2 },
  { examType: 'NEET', subject: 'Biology', chapter: 'Cell Structure and Function', sortOrder: 3 },
  { examType: 'NEET', subject: 'Biology', chapter: 'Plant Physiology', sortOrder: 4 },
  { examType: 'NEET', subject: 'Biology', chapter: 'Human Physiology', sortOrder: 5 },
  { examType: 'NEET', subject: 'Biology', chapter: 'Reproduction', sortOrder: 6 },
  { examType: 'NEET', subject: 'Biology', chapter: 'Genetics and Evolution', sortOrder: 7 },
  { examType: 'NEET', subject: 'Biology', chapter: 'Biology and Human Welfare', sortOrder: 8 },
  { examType: 'NEET', subject: 'Biology', chapter: 'Biotechnology', sortOrder: 9 },
  { examType: 'NEET', subject: 'Biology', chapter: 'Ecology and Environment', sortOrder: 10 },

  // ═══════════════════════════════════════════
  // CBSE CLASS 12
  // ═══════════════════════════════════════════

  // ── Physics ──
  { examType: 'CBSE_12', subject: 'Physics', chapter: 'Electric Charges and Fields', sortOrder: 1 },
  { examType: 'CBSE_12', subject: 'Physics', chapter: 'Electrostatic Potential and Capacitance', sortOrder: 2 },
  { examType: 'CBSE_12', subject: 'Physics', chapter: 'Current Electricity', sortOrder: 3 },
  { examType: 'CBSE_12', subject: 'Physics', chapter: 'Moving Charges and Magnetism', sortOrder: 4 },
  { examType: 'CBSE_12', subject: 'Physics', chapter: 'Magnetism and Matter', sortOrder: 5 },
  { examType: 'CBSE_12', subject: 'Physics', chapter: 'Electromagnetic Induction', sortOrder: 6 },
  { examType: 'CBSE_12', subject: 'Physics', chapter: 'Alternating Current', sortOrder: 7 },
  { examType: 'CBSE_12', subject: 'Physics', chapter: 'Electromagnetic Waves', sortOrder: 8 },
  { examType: 'CBSE_12', subject: 'Physics', chapter: 'Ray Optics and Optical Instruments', sortOrder: 9 },
  { examType: 'CBSE_12', subject: 'Physics', chapter: 'Wave Optics', sortOrder: 10 },
  { examType: 'CBSE_12', subject: 'Physics', chapter: 'Dual Nature of Radiation and Matter', sortOrder: 11 },
  { examType: 'CBSE_12', subject: 'Physics', chapter: 'Atoms', sortOrder: 12 },
  { examType: 'CBSE_12', subject: 'Physics', chapter: 'Nuclei', sortOrder: 13 },
  { examType: 'CBSE_12', subject: 'Physics', chapter: 'Semiconductor Electronics', sortOrder: 14 },

  // ── Chemistry ──
  { examType: 'CBSE_12', subject: 'Chemistry', chapter: 'Solutions', sortOrder: 1 },
  { examType: 'CBSE_12', subject: 'Chemistry', chapter: 'Electrochemistry', sortOrder: 2 },
  { examType: 'CBSE_12', subject: 'Chemistry', chapter: 'Chemical Kinetics', sortOrder: 3 },
  { examType: 'CBSE_12', subject: 'Chemistry', chapter: 'd- and f-Block Elements', sortOrder: 4 },
  { examType: 'CBSE_12', subject: 'Chemistry', chapter: 'Coordination Compounds', sortOrder: 5 },
  { examType: 'CBSE_12', subject: 'Chemistry', chapter: 'Haloalkanes and Haloarenes', sortOrder: 6 },
  { examType: 'CBSE_12', subject: 'Chemistry', chapter: 'Alcohols, Phenols and Ethers', sortOrder: 7 },
  { examType: 'CBSE_12', subject: 'Chemistry', chapter: 'Aldehydes, Ketones and Carboxylic Acids', sortOrder: 8 },
  { examType: 'CBSE_12', subject: 'Chemistry', chapter: 'Amines', sortOrder: 9 },
  { examType: 'CBSE_12', subject: 'Chemistry', chapter: 'Biomolecules', sortOrder: 10 },

  // ── Mathematics ──
  { examType: 'CBSE_12', subject: 'Mathematics', chapter: 'Relations and Functions', sortOrder: 1 },
  { examType: 'CBSE_12', subject: 'Mathematics', chapter: 'Inverse Trigonometric Functions', sortOrder: 2 },
  { examType: 'CBSE_12', subject: 'Mathematics', chapter: 'Matrices', sortOrder: 3 },
  { examType: 'CBSE_12', subject: 'Mathematics', chapter: 'Determinants', sortOrder: 4 },
  { examType: 'CBSE_12', subject: 'Mathematics', chapter: 'Continuity and Differentiability', sortOrder: 5 },
  { examType: 'CBSE_12', subject: 'Mathematics', chapter: 'Applications of Derivatives', sortOrder: 6 },
  { examType: 'CBSE_12', subject: 'Mathematics', chapter: 'Integrals', sortOrder: 7 },
  { examType: 'CBSE_12', subject: 'Mathematics', chapter: 'Applications of Integrals', sortOrder: 8 },
  { examType: 'CBSE_12', subject: 'Mathematics', chapter: 'Differential Equations', sortOrder: 9 },
  { examType: 'CBSE_12', subject: 'Mathematics', chapter: 'Vectors', sortOrder: 10 },
  { examType: 'CBSE_12', subject: 'Mathematics', chapter: 'Three-Dimensional Geometry', sortOrder: 11 },
  { examType: 'CBSE_12', subject: 'Mathematics', chapter: 'Linear Programming', sortOrder: 12 },
  { examType: 'CBSE_12', subject: 'Mathematics', chapter: 'Probability', sortOrder: 13 },

  // ── Biology ──
  { examType: 'CBSE_12', subject: 'Biology', chapter: 'Sexual Reproduction in Flowering Plants', sortOrder: 1 },
  { examType: 'CBSE_12', subject: 'Biology', chapter: 'Human Reproduction', sortOrder: 2 },
  { examType: 'CBSE_12', subject: 'Biology', chapter: 'Reproductive Health', sortOrder: 3 },
  { examType: 'CBSE_12', subject: 'Biology', chapter: 'Principles of Inheritance and Variation', sortOrder: 4 },
  { examType: 'CBSE_12', subject: 'Biology', chapter: 'Molecular Basis of Inheritance', sortOrder: 5 },
  { examType: 'CBSE_12', subject: 'Biology', chapter: 'Evolution', sortOrder: 6 },
  { examType: 'CBSE_12', subject: 'Biology', chapter: 'Human Health and Disease', sortOrder: 7 },
  { examType: 'CBSE_12', subject: 'Biology', chapter: 'Microbes in Human Welfare', sortOrder: 8 },
  { examType: 'CBSE_12', subject: 'Biology', chapter: 'Biotechnology: Principles and Processes', sortOrder: 9 },
  { examType: 'CBSE_12', subject: 'Biology', chapter: 'Biotechnology and its Applications', sortOrder: 10 },
  { examType: 'CBSE_12', subject: 'Biology', chapter: 'Organisms and Populations', sortOrder: 11 },
  { examType: 'CBSE_12', subject: 'Biology', chapter: 'Ecosystem', sortOrder: 12 },
  { examType: 'CBSE_12', subject: 'Biology', chapter: 'Biodiversity and Conservation', sortOrder: 13 },

  // ═══════════════════════════════════════════
  // MHT CET
  // ═══════════════════════════════════════════

  // ── Physics ──
  { examType: 'MHT_CET', subject: 'Physics', chapter: 'Measurement', sortOrder: 1 },
  { examType: 'MHT_CET', subject: 'Physics', chapter: 'Scalars and Vectors', sortOrder: 2 },
  { examType: 'MHT_CET', subject: 'Physics', chapter: 'Force', sortOrder: 3 },
  { examType: 'MHT_CET', subject: 'Physics', chapter: 'Friction in Solids and Liquids', sortOrder: 4 },
  { examType: 'MHT_CET', subject: 'Physics', chapter: 'Circular Motion', sortOrder: 5 },
  { examType: 'MHT_CET', subject: 'Physics', chapter: 'Gravitation', sortOrder: 6 },
  { examType: 'MHT_CET', subject: 'Physics', chapter: 'Rotational Motion', sortOrder: 7 },
  { examType: 'MHT_CET', subject: 'Physics', chapter: 'Elasticity', sortOrder: 8 },
  { examType: 'MHT_CET', subject: 'Physics', chapter: 'Surface Tension', sortOrder: 9 },
  { examType: 'MHT_CET', subject: 'Physics', chapter: 'Wave Motion', sortOrder: 10 },
  { examType: 'MHT_CET', subject: 'Physics', chapter: 'Stationary Waves', sortOrder: 11 },
  { examType: 'MHT_CET', subject: 'Physics', chapter: 'Oscillations', sortOrder: 12 },
  { examType: 'MHT_CET', subject: 'Physics', chapter: 'Kinetic Theory of Gases and Thermodynamics', sortOrder: 13 },
  { examType: 'MHT_CET', subject: 'Physics', chapter: 'Refraction of Light', sortOrder: 14 },
  { examType: 'MHT_CET', subject: 'Physics', chapter: 'Ray Optics', sortOrder: 15 },
  { examType: 'MHT_CET', subject: 'Physics', chapter: 'Wave Theory of Light', sortOrder: 16 },
  { examType: 'MHT_CET', subject: 'Physics', chapter: 'Interference and Diffraction', sortOrder: 17 },
  { examType: 'MHT_CET', subject: 'Physics', chapter: 'Electrostatics', sortOrder: 18 },
  { examType: 'MHT_CET', subject: 'Physics', chapter: 'Current Electricity', sortOrder: 19 },
  { examType: 'MHT_CET', subject: 'Physics', chapter: 'Magnetic Effects of Electric Current', sortOrder: 20 },
  { examType: 'MHT_CET', subject: 'Physics', chapter: 'Magnetism', sortOrder: 21 },
  { examType: 'MHT_CET', subject: 'Physics', chapter: 'Electromagnetism', sortOrder: 22 },
  { examType: 'MHT_CET', subject: 'Physics', chapter: 'Electrons and Photons', sortOrder: 23 },
  { examType: 'MHT_CET', subject: 'Physics', chapter: 'Atoms, Molecules and Nuclei', sortOrder: 24 },
  { examType: 'MHT_CET', subject: 'Physics', chapter: 'Semiconductor', sortOrder: 25 },
  { examType: 'MHT_CET', subject: 'Physics', chapter: 'Communication System', sortOrder: 26 },

  // ── Chemistry ──
  { examType: 'MHT_CET', subject: 'Chemistry', chapter: 'Basic Concepts of Chemistry', sortOrder: 1 },
  { examType: 'MHT_CET', subject: 'Chemistry', chapter: 'States of Matter', sortOrder: 2 },
  { examType: 'MHT_CET', subject: 'Chemistry', chapter: 'Structure of Atom', sortOrder: 3 },
  { examType: 'MHT_CET', subject: 'Chemistry', chapter: 'Nature of Chemical Bond', sortOrder: 4 },
  { examType: 'MHT_CET', subject: 'Chemistry', chapter: 'Redox Reactions', sortOrder: 5 },
  { examType: 'MHT_CET', subject: 'Chemistry', chapter: 'Basic Principles of Organic Chemistry', sortOrder: 6 },
  { examType: 'MHT_CET', subject: 'Chemistry', chapter: 'Alkanes', sortOrder: 7 },
  { examType: 'MHT_CET', subject: 'Chemistry', chapter: 's-Block Elements', sortOrder: 8 },
  { examType: 'MHT_CET', subject: 'Chemistry', chapter: 'Surface Chemistry', sortOrder: 9 },
  { examType: 'MHT_CET', subject: 'Chemistry', chapter: 'Thermodynamics', sortOrder: 10 },
  { examType: 'MHT_CET', subject: 'Chemistry', chapter: 'Solid State', sortOrder: 11 },
  { examType: 'MHT_CET', subject: 'Chemistry', chapter: 'Solution and Colligative Properties', sortOrder: 12 },
  { examType: 'MHT_CET', subject: 'Chemistry', chapter: 'Electrochemistry', sortOrder: 13 },
  { examType: 'MHT_CET', subject: 'Chemistry', chapter: 'Chemical Kinetics', sortOrder: 14 },
  { examType: 'MHT_CET', subject: 'Chemistry', chapter: 'p-Block Elements', sortOrder: 15 },
  { examType: 'MHT_CET', subject: 'Chemistry', chapter: 'd- and f-Block Elements', sortOrder: 16 },
  { examType: 'MHT_CET', subject: 'Chemistry', chapter: 'Coordination Compounds', sortOrder: 17 },
  { examType: 'MHT_CET', subject: 'Chemistry', chapter: 'Halogen Derivatives of Alkanes', sortOrder: 18 },
  { examType: 'MHT_CET', subject: 'Chemistry', chapter: 'Alcohol, Phenol and Ether', sortOrder: 19 },
  { examType: 'MHT_CET', subject: 'Chemistry', chapter: 'Aldehyde and Ketone', sortOrder: 20 },
  { examType: 'MHT_CET', subject: 'Chemistry', chapter: 'Organic Compounds', sortOrder: 21 },
  { examType: 'MHT_CET', subject: 'Chemistry', chapter: 'Biomolecules', sortOrder: 22 },
  { examType: 'MHT_CET', subject: 'Chemistry', chapter: 'Polymers', sortOrder: 23 },
  { examType: 'MHT_CET', subject: 'Chemistry', chapter: 'Chemistry in Everyday Life', sortOrder: 24 },

  // ── Mathematics ──
  { examType: 'MHT_CET', subject: 'Mathematics', chapter: 'Sets', sortOrder: 1 },
  { examType: 'MHT_CET', subject: 'Mathematics', chapter: 'Relations and Functions', sortOrder: 2 },
  { examType: 'MHT_CET', subject: 'Mathematics', chapter: 'Trigonometric Functions', sortOrder: 3 },
  { examType: 'MHT_CET', subject: 'Mathematics', chapter: 'Trigonometric Functions of Compound Angles', sortOrder: 4 },
  { examType: 'MHT_CET', subject: 'Mathematics', chapter: 'Factorization Formulae', sortOrder: 5 },
  { examType: 'MHT_CET', subject: 'Mathematics', chapter: 'Straight Line', sortOrder: 6 },
  { examType: 'MHT_CET', subject: 'Mathematics', chapter: 'Circle and Conics', sortOrder: 7 },
  { examType: 'MHT_CET', subject: 'Mathematics', chapter: 'Pair of Straight Lines', sortOrder: 8 },
  { examType: 'MHT_CET', subject: 'Mathematics', chapter: 'Vectors', sortOrder: 9 },
  { examType: 'MHT_CET', subject: 'Mathematics', chapter: 'Three-Dimensional Geometry', sortOrder: 10 },
  { examType: 'MHT_CET', subject: 'Mathematics', chapter: 'Line', sortOrder: 11 },
  { examType: 'MHT_CET', subject: 'Mathematics', chapter: 'Plane', sortOrder: 12 },
  { examType: 'MHT_CET', subject: 'Mathematics', chapter: 'Matrices', sortOrder: 13 },
  { examType: 'MHT_CET', subject: 'Mathematics', chapter: 'Continuity', sortOrder: 14 },
  { examType: 'MHT_CET', subject: 'Mathematics', chapter: 'Differentiation', sortOrder: 15 },
  { examType: 'MHT_CET', subject: 'Mathematics', chapter: 'Application of Derivatives', sortOrder: 16 },
  { examType: 'MHT_CET', subject: 'Mathematics', chapter: 'Integration and Definite Integral', sortOrder: 17 },
  { examType: 'MHT_CET', subject: 'Mathematics', chapter: 'Application of Integration', sortOrder: 18 },
  { examType: 'MHT_CET', subject: 'Mathematics', chapter: 'Differential Equations', sortOrder: 19 },
  { examType: 'MHT_CET', subject: 'Mathematics', chapter: 'Sequences and Series', sortOrder: 20 },
  { examType: 'MHT_CET', subject: 'Mathematics', chapter: 'Probability', sortOrder: 21 },
  { examType: 'MHT_CET', subject: 'Mathematics', chapter: 'Probability Distribution', sortOrder: 22 },
  { examType: 'MHT_CET', subject: 'Mathematics', chapter: 'Binomial Distribution', sortOrder: 23 },
  { examType: 'MHT_CET', subject: 'Mathematics', chapter: 'Linear Programming Problems', sortOrder: 24 },

  // ── Biology ──
  { examType: 'MHT_CET', subject: 'Biology', chapter: 'Plant Diversity', sortOrder: 1 },
  { examType: 'MHT_CET', subject: 'Biology', chapter: 'Plant Anatomy', sortOrder: 2 },
  { examType: 'MHT_CET', subject: 'Biology', chapter: 'Plant Morphology', sortOrder: 3 },
  { examType: 'MHT_CET', subject: 'Biology', chapter: 'Cell Biology and Cell Division', sortOrder: 4 },
  { examType: 'MHT_CET', subject: 'Biology', chapter: 'Biomolecules', sortOrder: 5 },
  { examType: 'MHT_CET', subject: 'Biology', chapter: 'Plant Physiology', sortOrder: 6 },
  { examType: 'MHT_CET', subject: 'Biology', chapter: 'Plant Reproduction', sortOrder: 7 },
  { examType: 'MHT_CET', subject: 'Biology', chapter: 'Genetics and Biotechnology', sortOrder: 8 },
  { examType: 'MHT_CET', subject: 'Biology', chapter: 'Biology in Human Welfare', sortOrder: 9 },
  { examType: 'MHT_CET', subject: 'Biology', chapter: 'Ecology', sortOrder: 10 },

  // ═══════════════════════════════════════════
  // CUET (Common University Entrance Test)
  // ═══════════════════════════════════════════

  // ── English Language ──
  { examType: 'CUET', subject: 'English Language', chapter: 'Reading Comprehension', sortOrder: 1 },
  { examType: 'CUET', subject: 'English Language', chapter: 'Vocabulary and Word Meaning', sortOrder: 2 },
  { examType: 'CUET', subject: 'English Language', chapter: 'Grammar and Sentence Correction', sortOrder: 3 },
  { examType: 'CUET', subject: 'English Language', chapter: 'Para Jumbles', sortOrder: 4 },
  { examType: 'CUET', subject: 'English Language', chapter: 'Cloze Test', sortOrder: 5 },
  { examType: 'CUET', subject: 'English Language', chapter: 'Verbal Analogies', sortOrder: 6 },
  { examType: 'CUET', subject: 'English Language', chapter: 'Idioms and Phrases', sortOrder: 7 },
  { examType: 'CUET', subject: 'English Language', chapter: 'Error Spotting', sortOrder: 8 },

  // ── General Knowledge ──
  { examType: 'CUET', subject: 'General Knowledge', chapter: 'Indian History and Culture', sortOrder: 1 },
  { examType: 'CUET', subject: 'General Knowledge', chapter: 'Indian Geography', sortOrder: 2 },
  { examType: 'CUET', subject: 'General Knowledge', chapter: 'Indian Polity and Constitution', sortOrder: 3 },
  { examType: 'CUET', subject: 'General Knowledge', chapter: 'Indian Economy', sortOrder: 4 },
  { examType: 'CUET', subject: 'General Knowledge', chapter: 'Science and Technology', sortOrder: 5 },
  { examType: 'CUET', subject: 'General Knowledge', chapter: 'Awards, Honors and Sports', sortOrder: 6 },
  { examType: 'CUET', subject: 'General Knowledge', chapter: 'Books and Authors', sortOrder: 7 },

  // ── Logical Reasoning ──
  { examType: 'CUET', subject: 'Logical Reasoning', chapter: 'Analogies and Classification', sortOrder: 1 },
  { examType: 'CUET', subject: 'Logical Reasoning', chapter: 'Coding-Decoding', sortOrder: 2 },
  { examType: 'CUET', subject: 'Logical Reasoning', chapter: 'Blood Relations', sortOrder: 3 },
  { examType: 'CUET', subject: 'Logical Reasoning', chapter: 'Direction Sense', sortOrder: 4 },
  { examType: 'CUET', subject: 'Logical Reasoning', chapter: 'Syllogisms', sortOrder: 5 },
  { examType: 'CUET', subject: 'Logical Reasoning', chapter: 'Puzzles and Seating Arrangement', sortOrder: 6 },
  { examType: 'CUET', subject: 'Logical Reasoning', chapter: 'Statement and Assumptions', sortOrder: 7 },
  { examType: 'CUET', subject: 'Logical Reasoning', chapter: 'Data Sufficiency', sortOrder: 8 },

  // ── Numerical Ability ──
  { examType: 'CUET', subject: 'Numerical Ability', chapter: 'Number System', sortOrder: 1 },
  { examType: 'CUET', subject: 'Numerical Ability', chapter: 'Averages and Percentages', sortOrder: 2 },
  { examType: 'CUET', subject: 'Numerical Ability', chapter: 'Profit, Loss and Discount', sortOrder: 3 },
  { examType: 'CUET', subject: 'Numerical Ability', chapter: 'Time, Speed and Distance', sortOrder: 4 },
  { examType: 'CUET', subject: 'Numerical Ability', chapter: 'Time and Work', sortOrder: 5 },
  { examType: 'CUET', subject: 'Numerical Ability', chapter: 'Ratio, Proportion and Mixtures', sortOrder: 6 },
  { examType: 'CUET', subject: 'Numerical Ability', chapter: 'Algebra and Linear Equations', sortOrder: 7 },
  { examType: 'CUET', subject: 'Numerical Ability', chapter: 'Geometry and Mensuration', sortOrder: 8 },
  { examType: 'CUET', subject: 'Numerical Ability', chapter: 'Probability and Statistics', sortOrder: 9 },
  { examType: 'CUET', subject: 'Numerical Ability', chapter: 'Data Interpretation', sortOrder: 10 },

  // ── Current Affairs ──
  { examType: 'CUET', subject: 'Current Affairs', chapter: 'National Affairs', sortOrder: 1 },
  { examType: 'CUET', subject: 'Current Affairs', chapter: 'International Affairs', sortOrder: 2 },
  { examType: 'CUET', subject: 'Current Affairs', chapter: 'Sports News', sortOrder: 3 },
  { examType: 'CUET', subject: 'Current Affairs', chapter: 'Appointments and Resignations', sortOrder: 4 },
  { examType: 'CUET', subject: 'Current Affairs', chapter: 'Summits and Conferences', sortOrder: 5 },
  { examType: 'CUET', subject: 'Current Affairs', chapter: 'Schemes and Policies', sortOrder: 6 },

  // ═══════════════════════════════════════════
  // GATE (Graduate Aptitude Test in Engineering)
  // ═══════════════════════════════════════════

  // ── General Aptitude ──
  { examType: 'GATE', subject: 'General Aptitude', chapter: 'Verbal Ability: Grammar and Vocabulary', sortOrder: 1 },
  { examType: 'GATE', subject: 'General Aptitude', chapter: 'Verbal Ability: Sentence Completion', sortOrder: 2 },
  { examType: 'GATE', subject: 'General Aptitude', chapter: 'Numerical Ability: Basic Mathematics', sortOrder: 3 },
  { examType: 'GATE', subject: 'General Aptitude', chapter: 'Numerical Ability: Estimation and Approximation', sortOrder: 4 },
  { examType: 'GATE', subject: 'General Aptitude', chapter: 'Spatial Aptitude', sortOrder: 5 },

  // ── Engineering Mathematics ──
  { examType: 'GATE', subject: 'Engineering Mathematics', chapter: 'Linear Algebra', sortOrder: 1 },
  { examType: 'GATE', subject: 'Engineering Mathematics', chapter: 'Calculus', sortOrder: 2 },
  { examType: 'GATE', subject: 'Engineering Mathematics', chapter: 'Differential Equations', sortOrder: 3 },
  { examType: 'GATE', subject: 'Engineering Mathematics', chapter: 'Probability and Statistics', sortOrder: 4 },
  { examType: 'GATE', subject: 'Engineering Mathematics', chapter: 'Numerical Methods', sortOrder: 5 },
  { examType: 'GATE', subject: 'Engineering Mathematics', chapter: 'Complex Variables', sortOrder: 6 },
  { examType: 'GATE', subject: 'Engineering Mathematics', chapter: 'Transform Theory', sortOrder: 7 },
  { examType: 'GATE', subject: 'Engineering Mathematics', chapter: 'Discrete Mathematics', sortOrder: 8 },

  // ── Computer Science and IT ──
  { examType: 'GATE', subject: 'Computer Science', chapter: 'Data Structures', sortOrder: 1 },
  { examType: 'GATE', subject: 'Computer Science', chapter: 'Algorithms', sortOrder: 2 },
  { examType: 'GATE', subject: 'Computer Science', chapter: 'Programming and C', sortOrder: 3 },
  { examType: 'GATE', subject: 'Computer Science', chapter: 'Computer Organization and Architecture', sortOrder: 4 },
  { examType: 'GATE', subject: 'Computer Science', chapter: 'Operating Systems', sortOrder: 5 },
  { examType: 'GATE', subject: 'Computer Science', chapter: 'Databases', sortOrder: 6 },
  { examType: 'GATE', subject: 'Computer Science', chapter: 'Computer Networks', sortOrder: 7 },
  { examType: 'GATE', subject: 'Computer Science', chapter: 'Theory of Computation', sortOrder: 8 },
  { examType: 'GATE', subject: 'Computer Science', chapter: 'Compiler Design', sortOrder: 9 },
  { examType: 'GATE', subject: 'Computer Science', chapter: 'Digital Logic', sortOrder: 10 },
  { examType: 'GATE', subject: 'Computer Science', chapter: 'Software Engineering', sortOrder: 11 },
  { examType: 'GATE', subject: 'Computer Science', chapter: 'Web Technologies', sortOrder: 12 },

  // ═══════════════════════════════════════════
  // CAT (Common Admission Test)
  // ═══════════════════════════════════════════

  // ── VARC (Verbal Ability & Reading Comprehension) ──
  { examType: 'CAT', subject: 'VARC', chapter: 'Reading Comprehension', sortOrder: 1 },
  { examType: 'CAT', subject: 'VARC', chapter: 'Para Jumbles', sortOrder: 2 },
  { examType: 'CAT', subject: 'VARC', chapter: 'Sentence Correction', sortOrder: 3 },
  { examType: 'CAT', subject: 'VARC', chapter: 'Vocabulary and Fill in the Blanks', sortOrder: 4 },
  { examType: 'CAT', subject: 'VARC', chapter: 'Summary Questions', sortOrder: 5 },
  { examType: 'CAT', subject: 'VARC', chapter: 'Paragraph Completion', sortOrder: 6 },
  { examType: 'CAT', subject: 'VARC', chapter: 'Critical Reasoning', sortOrder: 7 },
  { examType: 'CAT', subject: 'VARC', chapter: 'Verbal Analogies', sortOrder: 8 },

  // ── DILR (Data Interpretation & Logical Reasoning) ──
  { examType: 'CAT', subject: 'DILR', chapter: 'Data Tables', sortOrder: 1 },
  { examType: 'CAT', subject: 'DILR', chapter: 'Bar Graphs and Histograms', sortOrder: 2 },
  { examType: 'CAT', subject: 'DILR', chapter: 'Line Charts', sortOrder: 3 },
  { examType: 'CAT', subject: 'DILR', chapter: 'Pie Charts', sortOrder: 4 },
  { examType: 'CAT', subject: 'DILR', chapter: 'Caselet Data Interpretation', sortOrder: 5 },
  { examType: 'CAT', subject: 'DILR', chapter: 'Venn Diagrams', sortOrder: 6 },
  { examType: 'CAT', subject: 'DILR', chapter: 'Puzzles and Grids', sortOrder: 7 },
  { examType: 'CAT', subject: 'DILR', chapter: 'Seating Arrangement', sortOrder: 8 },
  { examType: 'CAT', subject: 'DILR', chapter: 'Syllogisms and Logical Reasoning', sortOrder: 9 },

  // ── QA (Quantitative Ability) ──
  { examType: 'CAT', subject: 'Quantitative Ability', chapter: 'Number Systems', sortOrder: 1 },
  { examType: 'CAT', subject: 'Quantitative Ability', chapter: 'Percentages and Profit Loss', sortOrder: 2 },
  { examType: 'CAT', subject: 'Quantitative Ability', chapter: 'Time, Speed and Distance', sortOrder: 3 },
  { examType: 'CAT', subject: 'Quantitative Ability', chapter: 'Time and Work', sortOrder: 4 },
  { examType: 'CAT', subject: 'Quantitative Ability', chapter: 'Ratio, Proportion and Mixtures', sortOrder: 5 },
  { examType: 'CAT', subject: 'Quantitative Ability', chapter: 'Simple and Compound Interest', sortOrder: 6 },
  { examType: 'CAT', subject: 'Quantitative Ability', chapter: 'Algebra and Functions', sortOrder: 7 },
  { examType: 'CAT', subject: 'Quantitative Ability', chapter: 'Geometry', sortOrder: 8 },
  { examType: 'CAT', subject: 'Quantitative Ability', chapter: 'Mensuration', sortOrder: 9 },
  { examType: 'CAT', subject: 'Quantitative Ability', chapter: 'Probability and Permutations', sortOrder: 10 },
  { examType: 'CAT', subject: 'Quantitative Ability', chapter: 'Progressions and Series', sortOrder: 11 },

  // ═══════════════════════════════════════════
  // UPSC (Civil Services Examination)
  // ═══════════════════════════════════════════

  // ── History ──
  { examType: 'UPSC', subject: 'History', chapter: 'Ancient India', sortOrder: 1 },
  { examType: 'UPSC', subject: 'History', chapter: 'Medieval India', sortOrder: 2 },
  { examType: 'UPSC', subject: 'History', chapter: 'Modern India: Freedom Struggle', sortOrder: 3 },
  { examType: 'UPSC', subject: 'History', chapter: 'Post-Independence India', sortOrder: 4 },
  { examType: 'UPSC', subject: 'History', chapter: 'World History', sortOrder: 5 },
  { examType: 'UPSC', subject: 'History', chapter: 'Indian Art and Culture', sortOrder: 6 },
  { examType: 'UPSC', subject: 'History', chapter: 'Indian Society', sortOrder: 7 },

  // ── Geography ──
  { examType: 'UPSC', subject: 'Geography', chapter: 'Physical Geography: World', sortOrder: 1 },
  { examType: 'UPSC', subject: 'Geography', chapter: 'Physical Geography: India', sortOrder: 2 },
  { examType: 'UPSC', subject: 'Geography', chapter: 'Economic Geography', sortOrder: 3 },
  { examType: 'UPSC', subject: 'Geography', chapter: 'Climate and Monsoon', sortOrder: 4 },
  { examType: 'UPSC', subject: 'Geography', chapter: 'Environment and Ecology', sortOrder: 5 },
  { examType: 'UPSC', subject: 'Geography', chapter: 'Biodiversity and Conservation', sortOrder: 6 },

  // ── Polity and Governance ──
  { examType: 'UPSC', subject: 'Polity', chapter: 'Indian Constitution: Framework', sortOrder: 1 },
  { examType: 'UPSC', subject: 'Polity', chapter: 'Union Executive and Legislature', sortOrder: 2 },
  { examType: 'UPSC', subject: 'Polity', chapter: 'State Executive and Legislature', sortOrder: 3 },
  { examType: 'UPSC', subject: 'Polity', chapter: 'Judiciary', sortOrder: 4 },
  { examType: 'UPSC', subject: 'Polity', chapter: 'Local Government and Panchayats', sortOrder: 5 },
  { examType: 'UPSC', subject: 'Polity', chapter: 'Constitutional Bodies', sortOrder: 6 },
  { examType: 'UPSC', subject: 'Polity', chapter: 'Governance and Social Justice', sortOrder: 7 },

  // ── Economy ──
  { examType: 'UPSC', subject: 'Economy', chapter: 'Basic Concepts of Economics', sortOrder: 1 },
  { examType: 'UPSC', subject: 'Economy', chapter: 'Indian Economy: Planning and Growth', sortOrder: 2 },
  { examType: 'UPSC', subject: 'Economy', chapter: 'Budget and Fiscal Policy', sortOrder: 3 },
  { examType: 'UPSC', subject: 'Economy', chapter: 'Banking and Monetary Policy', sortOrder: 4 },
  { examType: 'UPSC', subject: 'Economy', chapter: 'External Sector and Trade', sortOrder: 5 },
  { examType: 'UPSC', subject: 'Economy', chapter: 'Agriculture and Food Management', sortOrder: 6 },
  { examType: 'UPSC', subject: 'Economy', chapter: 'Infrastructure and Energy', sortOrder: 7 },

  // ── Science and Technology ──
  { examType: 'UPSC', subject: 'Science and Tech', chapter: 'General Science', sortOrder: 1 },
  { examType: 'UPSC', subject: 'Science and Tech', chapter: 'Biotechnology and Health', sortOrder: 2 },
  { examType: 'UPSC', subject: 'Science and Tech', chapter: 'Space Technology', sortOrder: 3 },
  { examType: 'UPSC', subject: 'Science and Tech', chapter: 'Defense Technology', sortOrder: 4 },
  { examType: 'UPSC', subject: 'Science and Tech', chapter: 'Information Technology', sortOrder: 5 },

  // ── Ethics and CSAT ──
  { examType: 'UPSC', subject: 'Ethics and CSAT', chapter: 'Ethics and Human Values', sortOrder: 1 },
  { examType: 'UPSC', subject: 'Ethics and CSAT', chapter: 'Attitude and Aptitude', sortOrder: 2 },
  { examType: 'UPSC', subject: 'Ethics and CSAT', chapter: 'Case Studies on Ethics', sortOrder: 3 },
  { examType: 'UPSC', subject: 'Ethics and CSAT', chapter: 'Comprehension', sortOrder: 4 },
  { examType: 'UPSC', subject: 'Ethics and CSAT', chapter: 'Interpersonal Skills', sortOrder: 5 },
  { examType: 'UPSC', subject: 'Ethics and CSAT', chapter: 'Decision Making', sortOrder: 6 },
  { examType: 'UPSC', subject: 'Ethics and CSAT', chapter: 'Basic Numeracy', sortOrder: 7 },
  { examType: 'UPSC', subject: 'Ethics and CSAT', chapter: 'Data Interpretation', sortOrder: 8 },
];

export const EXAM_TYPES_FOR_SYLLABUS = [
  { key: 'JEE', label: 'JEE Main' },
  { key: 'NEET', label: 'NEET UG' },
  { key: 'CBSE_12', label: 'CBSE Class 12' },
  { key: 'MHT_CET', label: 'MHT CET' },
  { key: 'CUET', label: 'CUET UG' },
  { key: 'GATE', label: 'GATE' },
  { key: 'CAT', label: 'CAT' },
  { key: 'UPSC', label: 'UPSC CSE' },
] as const;
