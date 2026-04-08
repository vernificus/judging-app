import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  deleteDoc,
  updateDoc,
  doc
} from 'firebase/firestore';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from 'firebase/auth';
import {
  Trophy,
  ClipboardCheck,
  Download,
  Users,
  School,
  Save,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  ListTodo,
  Trash2,
  Pencil,
  Lock,
  Medal,
  Award,
  X
} from 'lucide-react';

// --- Firebase Configuration ---
// Firebase config is loaded from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Check if Firebase config is valid before initializing
const isFirebaseConfigValid = firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId;

let app = null;
let auth = null;
let db = null;
let firebaseError = null;

if (isFirebaseConfigValid) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    // Initialize Analytics (optional - only in production)
    if (import.meta.env.PROD && import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) {
      getAnalytics(app);
    }
  } catch (error) {
    console.error("Firebase initialization error:", error);
    firebaseError = error.message;
  }
} else {
  console.error("Firebase config is missing required values:", firebaseConfig);
  firebaseError = "Firebase configuration is incomplete. Check environment variables.";
}

const appId = import.meta.env.VITE_APP_ID || 'innovation-judging';

// Dashboard password - set via environment variable or use default
const DASHBOARD_PASSWORD = import.meta.env.VITE_DASHBOARD_PASSWORD || 'judge2025';

// --- Constants ---
// School data with abbreviations and Innovation Project team names from the master spreadsheet
const SCHOOL_DATA = {
  // Propel Schools
  FDE: { name: "Frederick Douglass", program: "propel", teams: ["Marine Mythics", "Los Pandas", "Chimpanzee Savers", "Black Rhino", "Red Pandas", "The Beary Weary Helpers", "Sunda Tiger Slays", "Red Wolf Saving Group", "Orange Tree Trotters"] },
  FOR: { name: "Forest Grove", program: "propel", teams: ["The Slimey Goobers", "Barcelona", "The Forest Tigers", "The Rescuers", "The Tough Cookies", "The Sorcerers", "The Animal Heroes", "Big Power"] },
  GUI: { name: "Guilford", program: "propel", teams: ["Helping Ferrets", "Giant Pandas ASA", "Baboom", "The TDP", "The Drone Feeders", "Busy Beaver Co", "Bamboo Seed Spreader", "Panda Trio", "The Catchers"] },
  LEE: { name: "Leesburg", program: "propel", teams: ["The Turtle Sisters", "The Animal Rescuers", "Team of Greatness", "Sea Heroes", "Blue Alarm.com", "Eyes in the Sky", "The Savers", "Ferret Finders", "Paw Patrol"] },
  LUC: { name: "Lucketts", program: "propel", teams: ["The Engineering Whales", "The Space Invaders", "The GEX", "The Runners", "The Shreks"] },
  MEA: { name: "Meadowland", program: "propel", teams: ["Vaquita", "Amur Leopard", "Arctic Wolf", "Beavers", "Penguin Recyclers", "Hawksbill Helpers", "Maker Macaws", "Amur Armor", "Poacher Bots"] },
  PMK: { name: "Potomack", program: "propel", teams: ["Swift Panthers", "Three Musketeers", "Super Stars", "The Savers", "Oh Um Giant Pandas", "The Koalas", "Cheetahs", "I don't know, we keep changing it"] },
  RRD: { name: "Rolling Ridge", program: "propel", teams: ["Lac of Luck", "Team Capybaras", "The Ducksters", "Speedy Sloth", "Los Masters", "The 3 S's", "La Cucaracha", "οι κατσαρίδες (the cockroaches)", "The Eagles", "The Polar Bears"] },
  SUG: { name: "Sugarland", program: "propel", teams: ["AAMO", "Team Gorillas", "EDA", "The Triple A's", "McChicken Squad", "Animal Savers", "Drone Inventors", "Please Robux"] },
  SUL: { name: "Sully", program: "propel", teams: ["Smarties", "The Baby Cookie", "Los Six Seven Kids", "The Seal Squad", "Las Bananas", "Thunder Strikers", "Los Kids", "Los Ying and Yang Elephantos"] },
  // Level Up Schools
  HPM: { name: "Harper Park", program: "levelup", teams: ["Cosmic Cats", "Team PJO", "The Wild Robots", "The Lil' Baboons", "Worker Drones", "Pekka", "The Super Savers", "Underpaid Workers", "Bamboo Solute", "Lifting Turtles"] },
  JLS: { name: "Simpson", program: "levelup", teams: ["Try Hard Corporation", "Tigers ROAR", "Icy Spicys Jr", "Dylognevi", "The Three Ferrets", "The Rhinos", "Team 7", "Anti-BrainRot", "The Mechanics from Temu"] },
  SMM: { name: "Smarts Mill", program: "levelup", teams: ["European Mink", "African Wild Dogs", "Rhinos", "Dugongs (Sea Cows)", "Vaquitas", "Orangutan"] },
  SRM: { name: "Seneca Ridge", program: "levelup", teams: ["McLeopard ASMA", "AquaClean Manatees", "Stopping Elephant Poachers", "Super Sunda Inc", "CamoTherm", "Over The Savannah", "Red Panda Express", "The Penguin Savers", "Goldeneye Guardians", "Dolphin Rescue Inc", "Turtle Watch", "Baby Blue Inc", "Left Whale Inc", "Rhinotech Solution", "ANSA", "Medishell Inc", "Fun Ferrets Inc", "Tracked Traces", "Coco Roco Went Loco.co", "Anti-Animal Extinction Inc", "Aquatique Guardians", "The Great Grape Apes Inc", "LEAP", "TurtleTend Inc", "The Polar Express Inc", "Relaxing Rhino Association", "Dolphina", "EPA (Environmental Protection Agency)", "Peanut Oakley Corporation", "Saola Savers - Special Saola Safety Agency (SSSA)", "AquaThermal Corp"] },
  STM: { name: "Sterling", program: "levelup", teams: ["BRC (Black Rhino Company)", "African Elephant Helpers", "Vaquita Protection Agency", "Almera", "Leaf and Paws", "Panda Express 3000", "AES (African Elephants)", "Environment Savers", "Rhinoemilyn", "Panda Express", "Ferret Savers", "Sun Star Saviors", "Keeper of the Tigers", "Amur Protectors", "Axolotl Saviors", "Orangutan Rescue Inc.", "SAC (Seals are Cute)", "Team Whale", "SJJ Robotics", "Wildlife Warriors", "Urban Drone", "SaveTheRedPandas", "Hungry Hogs", "Golden Drones", "Aquatic Saves", "Save the Pandas"] },
};

// Helper to get school list for a program
const getSchoolsForProgram = (program) =>
  Object.entries(SCHOOL_DATA)
    .filter(([, data]) => data.program === program)
    .map(([abbr, data]) => ({ abbr, name: data.name }));

const PROPEL_SCHOOLS = getSchoolsForProgram('propel').map(s => s.name);
const LEVEL_UP_SCHOOLS = getSchoolsForProgram('levelup').map(s => s.name);

// Get teams for a school (by abbreviation or full name)
const getTeamsForSchool = (schoolKey) => {
  if (SCHOOL_DATA[schoolKey]) return SCHOOL_DATA[schoolKey].teams;
  const entry = Object.entries(SCHOOL_DATA).find(([, data]) => data.name === schoolKey);
  return entry ? entry[1].teams : [];
};

// Get abbreviation from full school name
const getSchoolAbbr = (schoolName) => {
  const entry = Object.entries(SCHOOL_DATA).find(([, data]) => data.name === schoolName);
  return entry ? entry[0] : schoolName;
};

// Get full name from abbreviation
const getSchoolName = (abbr) => {
  return SCHOOL_DATA[abbr] ? SCHOOL_DATA[abbr].name : abbr;
};

const PROGRAMS = [
  { id: 'propel', label: 'Propel' },
  { id: 'levelup', label: 'Level Up' }
];

// --- Rubric Data Structure ---
// Aligned with the official Innovation Day 2025-2026 rubric and presentation flow.
// Order matches the student presentation template: Pitch → Solution → STEM Model → Bonus → Automation → Drone Demo → Overall
const RUBRIC_SECTIONS = [
  {
    id: 'pitch',
    title: 'The Pitch (Shark Tank)',
    description: 'Endangered Animal Pitch - Knowledge & Understanding',
    items: [
      { id: 'pitch_intro', label: 'Shark Tank Pitch Intro', type: 'scale', max: 5,
        hint: 'Company name, name fits solution, specified investment amount',
        levels: ['No appropriate intro', 'Needed prompting', 'One of three pieces', 'Two of three pieces', 'All three intro pieces'] },
      { id: 'pitch_background', label: 'Background Information', type: 'scale', max: 5,
        hint: 'Why chosen, what makes endangered, why Sharks should care',
        levels: ['Struggled to explain', 'Needed prompting', 'One of three elements', 'Two of three elements', 'All three elements'] },
    ]
  },
  {
    id: 'solution',
    title: 'Solution Explanation',
    description: 'How does the drone solution help save the animal?',
    items: [
      { id: 'sol_drone', label: 'Drone Solution', type: 'scale', max: 5,
        hint: 'How drone flies mission, modifications, mission success, visual of parts, investment use',
        levels: ['1 element, no detail', '2 of 5 elements', '3 of 5 elements', '4 of 5 elements', 'All 5 elements'] },
    ]
  },
  {
    id: 'model',
    title: 'STEM Model',
    description: 'Habitat/Ecosystem STEM Model',
    items: [
      { id: 'model_animal', label: 'Endangered Animal', type: 'scale', max: 5,
        hint: 'Animal obvious, two versions: large Strawbees + small for model',
        levels: ['No focus, one version only', 'Hard to identify, one version', 'Needs some explanation, two versions', 'Obvious but may be hidden, two versions', 'Obvious & prominent, two versions'] },
      { id: 'model_habitat', label: 'Habitat/Ecosystem', type: 'scale', max: 5,
        hint: 'Food, shelter, water, food chain, other organisms, correct ecosystem, fits on tray',
        levels: ['Incomplete, not fitting on tray', '4-5 of 7 elements', '6 of 7 elements', 'All 7, mostly fits on tray', 'All 7 clearly, fits neatly on tray'] },
    ]
  },
  {
    id: 'bonus_terms',
    title: 'Ecosystem Bonus',
    description: '1 point per term correctly included (up to 8)',
    items: [
      { id: 'term_biotic', label: 'Abiotic / Biotic', type: 'check' },
      { id: 'term_renewable', label: 'Renewable vs. Nonrenewable resources', type: 'check' },
      { id: 'term_predator', label: 'Predators and Prey', type: 'check' },
      { id: 'term_producer', label: 'Producer, Consumer, Decomposer', type: 'check' },
      { id: 'term_energy', label: 'How energy is transferred', type: 'check' },
      { id: 'term_adapt', label: 'Adaptations (structural or behavioral)', type: 'check' },
      { id: 'term_human', label: 'Highlighting human impact', type: 'check' },
      { id: 'term_symb', label: 'Symbiotic relationships', type: 'check' },
    ]
  },
  {
    id: 'bonus_auto',
    title: 'Automation Bonus',
    description: 'Can students animate their animal using Micro:bit?',
    items: [
      { id: 'auto_animation', label: 'Animal Animation', type: 'scale', max: 5,
        hint: 'Animal moves using Micro:bit and motors, code shown',
        customScores: [0, 3, 5],
        levels: ['Not present (0 pts)', 'Animation works, no code shown (3 pts)', 'Animation works + code shown (5 pts)'] },
    ]
  },
  {
    id: 'drone_demo',
    title: 'Drone Demo & Coding',
    description: 'Drone flight demonstration and STEM additions',
    items: [
      { id: 'drone_flight', label: 'Drone Flight', type: 'scale', max: 5,
        hint: 'Autonomous flight, interaction with model, video evidence',
        levels: ['Not completing mission', 'Attempting but not successful', 'Autonomous + interacting, basic evidence', 'Autonomous + interacting, adequate evidence', 'Autonomous + interacting, clear evidence'] },
      { id: 'drone_stem', label: 'Drone STEM Additions', type: 'scale', max: 2,
        hint: 'STEM modifications present and functional on the drone',
        customScores: [0, 1, 2],
        levels: ['No additions (0 pts)', 'Present but may impede flight (1 pt)', 'Present, functional, don\'t impede flight (2 pts)'] },
    ]
  },
  {
    id: 'overall',
    title: 'Overall Experience',
    description: 'Presentation delivery and teamwork',
    items: [
      { id: 'overall_speaking', label: 'Speaking', type: 'scale', max: 5,
        hint: 'Confidence, expanding on slides vs reading',
        levels: ['Only read slides', 'Struggled without reading', 'Relied on slides, sometimes read', 'Used slides for prompting, didn\'t read', 'Spoke confidently, expanded beyond slides'] },
      { id: 'overall_knowledge', label: 'Prior Knowledge', type: 'scale', max: 5,
        hint: 'Presenting from knowledge vs dependence on slides',
        levels: ['Only read slides', 'Struggled without reading', 'Relied on slides, sometimes read', 'Used slides for prompting only', 'Presented from knowledge, expanded'] },
      { id: 'overall_teamwork', label: 'Teamwork', type: 'scale', max: 5,
        hint: 'Was teamwork evident throughout presentation and work?',
        levels: ['No roles, struggled through', 'Unorganized, prompted each other', 'One student clearly the lead', 'Mostly teamwork, 1-2 leads', 'Clear teamwork throughout'] },
    ]
  },
];

// --- Helper Functions ---
// Total max points across all sections
const TOTAL_MAX_POINTS = RUBRIC_SECTIONS.reduce((total, section) =>
  total + section.items.reduce((s, item) => s + (item.max || 1), 0), 0);

// Get the max possible score for a section
const getSectionMax = (sectionId) => {
  const section = RUBRIC_SECTIONS.find(s => s.id === sectionId);
  if (!section) return 0;
  return section.items.reduce((sum, item) => sum + (item.max || 1), 0);
};

// Get the score for a specific section from a submission's checklist
// Handles both old format (boolean checkboxes) and new format (numeric scales)
const getSectionScore = (submission, sectionId) => {
  const section = RUBRIC_SECTIONS.find(s => s.id === sectionId);
  if (!section || !submission.checklist) return 0;
  return section.items.reduce((sum, item) => {
    const val = submission.checklist[item.id];
    if (val === undefined || val === null) return sum;
    // Numeric value (new scale format)
    if (typeof val === 'number') return sum + val;
    // Boolean value (old checklist format or new check items)
    return sum + (val ? 1 : 0);
  }, 0);
};

// --- View Components ---
// These are defined at module level to prevent recreation on every render

function LandingView({ formData, setFormData, onStartScoring, onViewDashboard }) {
  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg mt-10">
      <div className="text-center mb-8">
        <Trophy className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-800">Innovation Judge</h1>
        <p className="text-gray-500">2025-2026 Scoring App</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Judge Name</label>
          <div className="relative">
            <Users className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Ex: Mr. Smith"
              value={formData.judgeName}
              onChange={e => setFormData({...formData, judgeName: e.target.value})}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
          <div className="relative">
            <Trophy className="absolute left-3 top-3 w-5 h-5 text-gray-400 z-10" />
            <select
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-700"
              value={formData.program}
              onChange={e => setFormData({...formData, program: e.target.value, schoolSection: '', teamName: ''})}
            >
              <option value="" disabled>Select a program</option>
              {PROGRAMS.map((prog) => (
                <option key={prog.id} value={prog.id}>
                  {prog.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {formData.program && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">School / Section</label>
            <div className="relative">
              <School className="absolute left-3 top-3 w-5 h-5 text-gray-400 z-10" />
              <select
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-700"
                value={formData.schoolSection}
                onChange={e => setFormData({...formData, schoolSection: e.target.value, teamName: ''})}
              >
                <option value="" disabled>Select a school</option>
                {getSchoolsForProgram(formData.program).map(({ abbr, name }) => (
                  <option key={abbr} value={name}>
                    {abbr} - {name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {formData.schoolSection && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
            <div className="relative">
              <Users className="absolute left-3 top-3 w-5 h-5 text-gray-400 z-10" />
              {getTeamsForSchool(formData.schoolSection).length > 0 ? (
                <select
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-700"
                  value={formData.teamName}
                  onChange={e => setFormData({...formData, teamName: e.target.value})}
                >
                  <option value="" disabled>Select a team</option>
                  {getTeamsForSchool(formData.schoolSection).map((team) => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Enter team name"
                  value={formData.teamName}
                  onChange={e => setFormData({...formData, teamName: e.target.value})}
                />
              )}
            </div>
          </div>
        )}

        <button
          onClick={onStartScoring}
          disabled={!formData.judgeName || !formData.teamName || !formData.program || !formData.schoolSection}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          Start Scoring <ChevronRight className="w-5 h-5" />
        </button>

        <div className="mt-6 pt-6 border-t text-center">
          <button
            onClick={onViewDashboard}
            className="text-gray-500 hover:text-blue-600 text-sm font-medium flex items-center justify-center gap-2 mx-auto"
          >
            View Dashboard <ClipboardCheck className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ScoringView({
  formData,
  checklist,
  onChecklistToggle,
  onScoreChange,
  onSubmit,
  onCancel,
  loading,
  currentTotal,
  maxPoints
}) {
  return (
    <div className="max-w-2xl mx-auto pb-20">
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 shadow-sm border-b p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-800 text-sm flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> Cancel
          </button>
          <div className="font-bold text-gray-800">{formData.teamName}</div>
          <div className="text-blue-600 font-bold text-lg">{currentTotal} <span className="text-xs text-gray-500">/ {maxPoints}</span></div>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-500"
            style={{ width: `${(currentTotal / maxPoints) * 100}%` }}
          />
        </div>
      </div>

      {/* Form */}
      <div className="space-y-6 px-4">
        {RUBRIC_SECTIONS.map((section) => (
          <div key={section.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="bg-blue-50 p-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <ListTodo className="w-5 h-5 text-blue-600" />
                  {section.title}
                </h3>
                <span className="text-sm font-semibold text-blue-600">
                  {getSectionScore({ checklist }, section.id)}/{getSectionMax(section.id)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{section.description}</p>
            </div>

            <div className="p-2 sm:p-4">
              <div className="grid grid-cols-1 gap-3">
                {section.items.map(item => {
                  if (item.type === 'check') {
                    // Checkbox item (bonus terms)
                    return (
                      <label
                        key={item.id}
                        className={`
                          flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all select-none
                          ${checklist[item.id]
                            ? 'bg-green-50 border-green-300 shadow-sm'
                            : 'bg-white border-gray-100 hover:bg-gray-50 hover:border-gray-300'}
                        `}
                      >
                        <div className="pt-0.5">
                          <input
                            type="checkbox"
                            className="w-6 h-6 text-green-600 rounded focus:ring-green-500 cursor-pointer"
                            checked={!!checklist[item.id]}
                            onChange={() => onChecklistToggle(item.id)}
                          />
                        </div>
                        <span className={`text-base ${checklist[item.id] ? 'text-green-900 font-medium' : 'text-gray-700'}`}>
                          {item.label}
                        </span>
                      </label>
                    );
                  }

                  // Scale item (1-5 or custom scores)
                  const scores = item.customScores || Array.from({ length: item.max }, (_, i) => i + 1);
                  const currentVal = checklist[item.id];
                  return (
                    <div key={item.id} className="p-3 rounded-lg border border-gray-100">
                      <div className="flex justify-between items-start mb-1">
                        <div className="font-medium text-gray-800">{item.label}</div>
                        <div className="text-sm font-semibold text-blue-600 whitespace-nowrap ml-2">
                          {currentVal !== undefined ? currentVal : '—'}/{item.max}
                        </div>
                      </div>
                      {item.hint && (
                        <p className="text-xs text-gray-400 mb-2">{item.hint}</p>
                      )}
                      <div className="flex gap-1.5 flex-wrap">
                        {scores.map((score, idx) => (
                          <button
                            key={score}
                            type="button"
                            onClick={() => onScoreChange(item.id, currentVal === score ? undefined : score)}
                            className={`relative group flex-1 min-w-[3rem] py-2.5 rounded-lg text-sm font-bold transition-all border-2 ${
                              currentVal === score
                                ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                            }`}
                          >
                            {score}
                            <span className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs rounded bg-gray-800 text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 max-w-[200px] text-center`}>
                              {item.levels[idx]}
                            </span>
                          </button>
                        ))}
                      </div>
                      {/* Show selected level description */}
                      {currentVal !== undefined && (
                        <p className="text-xs text-blue-600 mt-1.5 font-medium">
                          {item.levels[scores.indexOf(currentVal)]}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Submit Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg flex items-center justify-between max-w-2xl mx-auto z-20">
        <div className="text-sm">
          <span className="text-gray-500">Total Score:</span>
          <div className="font-bold text-2xl text-gray-800">{currentTotal} <span className="text-sm text-gray-400 font-normal">/ {maxPoints}</span></div>
        </div>
        <button
          onClick={onSubmit}
          disabled={loading}
          className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold shadow hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-70"
        >
          {loading ? 'Saving...' : 'Submit Score'}
          {!loading && <Save className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}

function DashboardView({ submittedData, onScoreNewTeam, onExportCSV, onDeleteEntry, onUpdateEntry }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [editingEntry, setEditingEntry] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Track which schools and teams are expanded
  const [expandedSchools, setExpandedSchools] = useState({});
  const [expandedTeams, setExpandedTeams] = useState({});

  const toggleSchool = (key) => setExpandedSchools(prev => ({ ...prev, [key]: !prev[key] }));
  const toggleTeam = (key) => setExpandedTeams(prev => ({ ...prev, [key]: !prev[key] }));

  // Group scores by program > school > team, compute averages
  const { propelData, levelupData, winners } = useMemo(() => {
    const buildProgramData = (data) => {
      const schools = {};
      data.forEach(item => {
        const school = item.schoolSection || 'Unassigned';
        if (!schools[school]) schools[school] = {};
        const team = item.teamName || 'Unknown';
        if (!schools[school][team]) schools[school][team] = [];
        schools[school][team].push(item);
      });

      // Compute averages per team
      const result = {};
      Object.entries(schools).forEach(([school, teams]) => {
        result[school] = Object.entries(teams).map(([teamName, entries]) => {
          const count = entries.length;
          const avg = (sectionId) => {
            const sum = entries.reduce((s, e) => s + getSectionScore(e, sectionId), 0);
            return Math.round((sum / count) * 10) / 10;
          };
          const avgTotal = Math.round((entries.reduce((s, e) => s + (e.totalScore || 0), 0) / count) * 10) / 10;
          return {
            teamName,
            entries,
            count,
            avgPitch: avg('pitch'),
            avgSolution: avg('solution'),
            avgModel: avg('model'),
            avgScience: avg('bonus_terms'),
            avgAuto: avg('bonus_auto'),
            avgDrone: avg('drone_demo'),
            avgPres: avg('overall'),
            avgTotal
          };
        });
      });
      return result;
    };

    const propelItems = submittedData.filter(i => (i.program || 'propel') !== 'levelup');
    const levelupItems = submittedData.filter(i => i.program === 'levelup');

    const propelSchools = buildProgramData(propelItems);
    const levelupSchools = buildProgramData(levelupItems);

    // Build flat team lists with school info for ranking
    const flattenTeams = (programData) => {
      const teams = [];
      Object.entries(programData).forEach(([school, schoolTeams]) => {
        schoolTeams.forEach(t => teams.push({ ...t, school }));
      });
      return teams;
    };

    // Compute top 3 teams per award category
    const getTop3 = (teams, key) =>
      [...teams].sort((a, b) => b[key] - a[key]).slice(0, 3);

    // Compute school rankings by average of team averages
    const getSchoolRankings = (programData) =>
      Object.entries(programData)
        .map(([school, teams]) => ({
          school,
          avgTotal: teams.length > 0
            ? Math.round((teams.reduce((s, t) => s + t.avgTotal, 0) / teams.length) * 10) / 10
            : 0,
          teamCount: teams.length
        }))
        .sort((a, b) => b.avgTotal - a.avgTotal);

    const propelTeams = flattenTeams(propelSchools);
    const levelupTeams = flattenTeams(levelupSchools);

    return {
      propelData: propelSchools,
      levelupData: levelupSchools,
      winners: {
        propel: {
          model: getTop3(propelTeams, 'avgModel'),
          pres: getTop3(propelTeams, 'avgPres'),
          drone: getTop3(propelTeams, 'avgDrone'),
          schoolRankings: getSchoolRankings(propelSchools)
        },
        levelup: {
          model: getTop3(levelupTeams, 'avgModel'),
          pres: getTop3(levelupTeams, 'avgPres'),
          drone: getTop3(levelupTeams, 'avgDrone'),
          schoolRankings: getSchoolRankings(levelupSchools)
        }
      }
    };
  }, [submittedData]);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password === DASHBOARD_PASSWORD) {
      setIsAuthenticated(true);
      setPasswordError('');
    } else {
      setPasswordError('Incorrect password');
    }
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setEditForm({
      teamName: entry.teamName,
      judgeName: entry.judgeName,
      program: entry.program || 'propel',
      schoolSection: entry.schoolSection,
      totalScore: entry.totalScore
    });
  };

  const handleSaveEdit = async () => {
    if (editingEntry && onUpdateEntry) {
      await onUpdateEntry(editingEntry.id, editForm);
      setEditingEntry(null);
    }
  };

  const handleDelete = async (id) => {
    if (onDeleteEntry) {
      await onDeleteEntry(id);
      setDeleteConfirm(null);
    }
  };

  // Password prompt screen
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg mt-10">
        <div className="text-center mb-8">
          <Lock className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold text-gray-800">Dashboard Access</h1>
          <p className="text-gray-500">Enter password to view and manage scores</p>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Enter dashboard password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoFocus
            />
            {passwordError && (
              <p className="text-red-500 text-sm mt-1">{passwordError}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Access Dashboard
          </button>

          <div className="mt-6 pt-6 border-t text-center">
            <button
              type="button"
              onClick={onScoreNewTeam}
              className="text-gray-500 hover:text-blue-600 text-sm font-medium flex items-center justify-center gap-2 mx-auto"
            >
              <ChevronLeft className="w-4 h-4" /> Back to Scoring
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 py-4 sm:py-6">
      {/* Edit Modal */}
      {editingEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Edit Entry</h2>
              <button onClick={() => setEditingEntry(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Judge Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={editForm.judgeName}
                  onChange={e => setEditForm({...editForm, judgeName: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
                <select
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={editForm.program}
                  onChange={e => setEditForm({...editForm, program: e.target.value, schoolSection: '', teamName: ''})}
                >
                  {PROGRAMS.map(prog => (
                    <option key={prog.id} value={prog.id}>{prog.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">School</label>
                <select
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={editForm.schoolSection}
                  onChange={e => setEditForm({...editForm, schoolSection: e.target.value, teamName: ''})}
                >
                  <option value="">Select a school</option>
                  {getSchoolsForProgram(editForm.program).map(({ abbr, name }) => (
                    <option key={abbr} value={name}>{abbr} - {name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
                {editForm.schoolSection && getTeamsForSchool(editForm.schoolSection).length > 0 ? (
                  <select
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={editForm.teamName}
                    onChange={e => setEditForm({...editForm, teamName: e.target.value})}
                  >
                    <option value="">Select a team</option>
                    {getTeamsForSchool(editForm.schoolSection).map(team => (
                      <option key={team} value={team}>{team}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={editForm.teamName}
                    onChange={e => setEditForm({...editForm, teamName: e.target.value})}
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Score</label>
                <input
                  type="number"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={editForm.totalScore}
                  onChange={e => setEditForm({...editForm, totalScore: parseInt(e.target.value) || 0})}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => setEditingEntry(null)}
                  className="flex-1 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Delete Entry?</h2>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete the score for <strong>{deleteConfirm.teamName}</strong>? This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Judging Dashboard</h1>
          <p className="text-gray-500">{submittedData.length} submissions total</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
           <button
            onClick={onScoreNewTeam}
            className="flex-1 sm:flex-none bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center justify-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" /> Score New Team
          </button>
          <button
            onClick={onExportCSV}
            disabled={submittedData.length === 0}
            className="flex-1 sm:flex-none bg-green-100 text-green-700 px-4 py-2 rounded-lg hover:bg-green-200 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {submittedData.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <ClipboardCheck className="w-12 h-12 mx-auto text-gray-300 mb-2" />
          <h3 className="text-gray-500 font-medium">No scores submitted yet</h3>
          <p className="text-gray-400 text-sm">Scores will appear here in real-time</p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Winners & Leaderboard Section */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="bg-yellow-50 px-6 py-4 border-b">
              <h2 className="text-xl font-bold text-yellow-800 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-600" /> Winners & Leaderboard
              </h2>
            </div>
            <div className="p-6">
              {[
                { label: 'Propel', data: winners.propel, color: 'blue' },
                { label: 'Level Up', data: winners.levelup, color: 'green' }
              ].filter(({ data }) => data.schoolRankings.length > 0).map(({ label, data, color }) => (
                <div key={label} className="mb-8 last:mb-0">
                  <h3 className={`text-lg font-bold ${color === 'blue' ? 'text-blue-800' : 'text-green-800'} mb-4`}>{label}</h3>

                  {/* Top School */}
                  <div className="mb-5">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                      <Award className="w-4 h-4" /> Top School — Highest Average Total
                    </h4>
                    <div className={`inline-flex items-center gap-3 ${color === 'blue' ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'} border rounded-lg px-4 py-3`}>
                      <Medal className={`w-6 h-6 ${color === 'blue' ? 'text-blue-600' : 'text-green-600'}`} />
                      <div>
                        <div className="font-bold text-gray-800 text-lg">
                          {data.schoolRankings[0] ? `${getSchoolAbbr(data.schoolRankings[0].school)} - ${data.schoolRankings[0].school}` : '—'}
                        </div>
                        <div className="text-sm text-gray-500">
                          Avg: {data.schoolRankings[0]?.avgTotal || 0}/{TOTAL_MAX_POINTS} across {data.schoolRankings[0]?.teamCount || 0} teams
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Award Categories */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { title: 'Best STEM Model', key: 'model', teams: data.model, max: getSectionMax('model') },
                      { title: 'Best Presentation', key: 'pres', teams: data.pres, max: getSectionMax('overall') },
                      { title: 'Best Drone Solution', key: 'drone', teams: data.drone, max: getSectionMax('drone_demo') }
                    ].map(({ title, key, teams, max }) => (
                      <div key={key} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-800 mb-3 flex items-center gap-1">
                          <Medal className="w-4 h-4 text-yellow-600" /> {title}
                        </h4>
                        <div className="space-y-2">
                          {teams.map((team, i) => (
                            <div key={team.teamName} className={`flex items-center gap-2 ${i === 0 ? 'font-bold' : ''}`}>
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                i === 0 ? 'bg-yellow-400 text-yellow-900'
                                : i === 1 ? 'bg-gray-300 text-gray-700'
                                : 'bg-amber-700 text-amber-100'
                              }`}>{i + 1}</span>
                              <div className="flex-1 min-w-0">
                                <div className="truncate text-sm text-gray-800">{team.teamName}</div>
                                <div className="text-xs text-gray-400">{getSchoolAbbr(team.school)} - {team.school}</div>
                              </div>
                              <span className="text-sm font-semibold text-yellow-700">
                                {key === 'model' ? team.avgModel : key === 'pres' ? team.avgPres : team.avgDrone}/{max}
                              </span>
                            </div>
                          ))}
                          {teams.length === 0 && <p className="text-sm text-gray-400 italic">No scores yet</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {[
            { label: 'Propel', data: propelData, styles: {
              heading: 'text-blue-800', headingIcon: 'text-blue-600',
              schoolBg: 'bg-blue-50 hover:bg-blue-100', badge: 'bg-blue-100 text-blue-600',
              avgHighlight: 'bg-blue-50/30', totalBadge: 'bg-blue-100 text-blue-700'
            }},
            { label: 'Level Up', data: levelupData, styles: {
              heading: 'text-green-800', headingIcon: 'text-green-600',
              schoolBg: 'bg-green-50 hover:bg-green-100', badge: 'bg-green-100 text-green-600',
              avgHighlight: 'bg-green-50/30', totalBadge: 'bg-green-100 text-green-700'
            }}
          ].filter(({ data }) => Object.keys(data).length > 0).map(({ label, data, styles }) => (
            <div key={label}>
              <h2 className={`text-xl font-bold ${styles.heading} mb-4 flex items-center gap-2`}>
                <Trophy className={`w-5 h-5 ${styles.headingIcon}`} /> {label}
              </h2>
              <div className="space-y-4">
                {Object.entries(data).map(([school, teams]) => {
                  const schoolKey = `${label}-${school}`;
                  const isSchoolOpen = expandedSchools[schoolKey] !== false; // default open
                  const totalSubmissions = teams.reduce((s, t) => s + t.count, 0);
                  const schoolAvgTotal = teams.length > 0
                    ? Math.round((teams.reduce((s, t) => s + t.avgTotal, 0) / teams.length) * 10) / 10
                    : 0;
                  return (
                    <div key={school} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                      <button
                        onClick={() => toggleSchool(schoolKey)}
                        className={`w-full ${styles.schoolBg} px-6 py-3 border-b flex justify-between items-center cursor-pointer transition`}
                      >
                        <h3 className="font-bold text-gray-700 flex items-center gap-2">
                          <School className="w-4 h-4" />
                          {getSchoolAbbr(school)} - {school}
                        </h3>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs ${styles.badge} px-2 py-1 rounded-full`}>
                            {teams.length} teams &middot; {totalSubmissions} scores
                          </span>
                          <span className={`text-sm font-bold ${styles.totalBadge} px-2 py-1 rounded`}>
                            School Avg: {schoolAvgTotal}/{TOTAL_MAX_POINTS}
                          </span>
                          {isSchoolOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </div>
                      </button>

                      {isSchoolOpen && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500">
                              <tr>
                                <th className="px-4 py-3 font-medium whitespace-nowrap w-8"></th>
                                <th className="px-4 py-3 font-medium whitespace-nowrap">Team</th>
                                <th className="px-4 py-3 font-medium whitespace-nowrap">Judge</th>
                                <th className="px-2 py-3 font-medium text-center whitespace-nowrap" title="The Pitch (Shark Tank)">Pitch</th>
                                <th className="px-2 py-3 font-medium text-center whitespace-nowrap" title="The Solution">Solution</th>
                                <th className="px-2 py-3 font-medium text-center whitespace-nowrap" title="The Habitat Model">Model</th>
                                <th className="px-2 py-3 font-medium text-center whitespace-nowrap" title="Bonus: Science Words">Science</th>
                                <th className="px-2 py-3 font-medium text-center whitespace-nowrap" title="Bonus: Automation">Auto</th>
                                <th className="px-2 py-3 font-medium text-center whitespace-nowrap" title="Drone Flight Demo">Drone</th>
                                <th className="px-2 py-3 font-medium text-center whitespace-nowrap" title="Presentation Skills">Pres</th>
                                <th className="px-3 py-3 font-medium text-center whitespace-nowrap">Total</th>
                                <th className="px-2 py-3 font-medium text-center whitespace-nowrap bg-yellow-50 border-l" title="Best STEM Model Award">STEM</th>
                                <th className="px-2 py-3 font-medium text-center whitespace-nowrap bg-yellow-50" title="Best Presentation Award">Pres Award</th>
                                <th className="px-2 py-3 font-medium text-center whitespace-nowrap bg-yellow-50 border-r" title="Best Drone Solution Award">Drone Award</th>
                                <th className="px-2 py-3 font-medium text-center whitespace-nowrap">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {teams.map((team) => {
                                const teamKey = `${schoolKey}-${team.teamName}`;
                                const isTeamOpen = expandedTeams[teamKey] || false;
                                return (
                                  <React.Fragment key={team.teamName}>
                                    {/* Average row */}
                                    <tr
                                      className={`cursor-pointer hover:bg-gray-50 ${isTeamOpen ? styles.avgHighlight : ''}`}
                                      onClick={() => toggleTeam(teamKey)}
                                    >
                                      <td className="px-4 py-3 text-center">
                                        {isTeamOpen
                                          ? <ChevronUp className="w-4 h-4 text-gray-400 inline" />
                                          : <ChevronDown className="w-4 h-4 text-gray-400 inline" />}
                                      </td>
                                      <td className="px-4 py-3 font-bold text-gray-800 whitespace-nowrap">{team.teamName}</td>
                                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap italic">
                                        avg of {team.count} {team.count === 1 ? 'judge' : 'judges'}
                                      </td>
                                      <td className="px-2 py-3 text-center font-semibold text-gray-700">{team.avgPitch}/{getSectionMax('pitch')}</td>
                                      <td className="px-2 py-3 text-center font-semibold text-gray-700">{team.avgSolution}/{getSectionMax('solution')}</td>
                                      <td className="px-2 py-3 text-center font-semibold text-gray-700">{team.avgModel}/{getSectionMax('model')}</td>
                                      <td className="px-2 py-3 text-center font-semibold text-gray-700">{team.avgScience}/{getSectionMax('bonus_terms')}</td>
                                      <td className="px-2 py-3 text-center font-semibold text-gray-700">{team.avgAuto}/{getSectionMax('bonus_auto')}</td>
                                      <td className="px-2 py-3 text-center font-semibold text-gray-700">{team.avgDrone}/{getSectionMax('drone_demo')}</td>
                                      <td className="px-2 py-3 text-center font-semibold text-gray-700">{team.avgPres}/{getSectionMax('overall')}</td>
                                      <td className="px-3 py-3 text-center">
                                        <span className={`${styles.totalBadge} font-bold px-2 py-1 rounded`}>
                                          {team.avgTotal}
                                        </span>
                                      </td>
                                      <td className="px-2 py-3 text-center bg-yellow-50/50 border-l">
                                        <span className="font-semibold text-yellow-700">{team.avgModel}/{getSectionMax('model')}</span>
                                      </td>
                                      <td className="px-2 py-3 text-center bg-yellow-50/50">
                                        <span className="font-semibold text-yellow-700">{team.avgPres}/{getSectionMax('overall')}</span>
                                      </td>
                                      <td className="px-2 py-3 text-center bg-yellow-50/50 border-r">
                                        <span className="font-semibold text-yellow-700">{team.avgDrone}/{getSectionMax('drone_demo')}</span>
                                      </td>
                                      <td className="px-2 py-3 text-center"></td>
                                    </tr>

                                    {/* Individual judge rows (expanded) */}
                                    {isTeamOpen && team.entries.map((row) => (
                                      <tr key={row.id} className="bg-gray-50/50 hover:bg-gray-100/50">
                                        <td className="px-4 py-2"></td>
                                        <td className="px-4 py-2 text-gray-500 text-xs whitespace-nowrap pl-8">{row.teamName}</td>
                                        <td className="px-4 py-2 text-gray-500 whitespace-nowrap">{row.judgeName}</td>
                                        <td className="px-2 py-2 text-center text-gray-600">{getSectionScore(row, 'pitch')}/{getSectionMax('pitch')}</td>
                                        <td className="px-2 py-2 text-center text-gray-600">{getSectionScore(row, 'solution')}/{getSectionMax('solution')}</td>
                                        <td className="px-2 py-2 text-center text-gray-600">{getSectionScore(row, 'model')}/{getSectionMax('model')}</td>
                                        <td className="px-2 py-2 text-center text-gray-600">{getSectionScore(row, 'bonus_terms')}/{getSectionMax('bonus_terms')}</td>
                                        <td className="px-2 py-2 text-center text-gray-600">{getSectionScore(row, 'bonus_auto')}/{getSectionMax('bonus_auto')}</td>
                                        <td className="px-2 py-2 text-center text-gray-600">{getSectionScore(row, 'drone_demo')}/{getSectionMax('drone_demo')}</td>
                                        <td className="px-2 py-2 text-center text-gray-600">{getSectionScore(row, 'overall')}/{getSectionMax('overall')}</td>
                                        <td className="px-3 py-2 text-center">
                                          <span className="text-gray-600 font-medium">{row.totalScore}</span>
                                        </td>
                                        <td className="px-2 py-2 text-center bg-yellow-50/30 border-l text-gray-500">{getSectionScore(row, 'model')}/{getSectionMax('model')}</td>
                                        <td className="px-2 py-2 text-center bg-yellow-50/30 text-gray-500">{getSectionScore(row, 'overall')}/{getSectionMax('overall')}</td>
                                        <td className="px-2 py-2 text-center bg-yellow-50/30 border-r text-gray-500">{getSectionScore(row, 'drone_demo')}/{getSectionMax('drone_demo')}</td>
                                        <td className="px-2 py-2 text-center">
                                          <div className="flex items-center justify-center gap-1">
                                            <button
                                              onClick={(e) => { e.stopPropagation(); handleEdit(row); }}
                                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                              title="Edit"
                                            >
                                              <Pencil className="w-3 h-3" />
                                            </button>
                                            <button
                                              onClick={(e) => { e.stopPropagation(); setDeleteConfirm(row); }}
                                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                                              title="Delete"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </React.Fragment>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Main App Component ---
export default function RubricApp() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('landing'); // landing, scoring, dashboard
  const [formData, setFormData] = useState({
    judgeName: '',
    program: '',
    schoolSection: '',
    teamName: ''
  });

  // Single state object for all checkboxes. Key = ID, Value = boolean
  const [checklist, setChecklist] = useState({});
  const [submittedData, setSubmittedData] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- Auth & Data Fetching ---
  useEffect(() => {
    if (!auth) return; // Skip if Firebase not initialized

    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error("Error signing in:", error);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !db) return; // Skip if Firebase not initialized

    const q = query(
      collection(db, 'artifacts', appId, 'public', 'data', 'scores'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSubmittedData(data);
    }, (error) => {
      console.error("Error fetching scores:", error);
    });

    return () => unsubscribe();
  }, [user]);

  // --- Handlers ---
  const handleStartScoring = () => {
    if (formData.judgeName && formData.teamName && formData.program && formData.schoolSection) {
      setView('scoring');
      setChecklist({});
    }
  };

  const handleChecklistToggle = (itemId) => {
    setChecklist(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleScoreChange = (itemId, value) => {
    setChecklist(prev => {
      const next = { ...prev };
      if (value === undefined) {
        delete next[itemId];
      } else {
        next[itemId] = value;
      }
      return next;
    });
  };

  const calculateTotal = () => {
    return Object.values(checklist).reduce((sum, val) => {
      if (typeof val === 'number') return sum + val;
      return sum + (val ? 1 : 0);
    }, 0);
  };

  const getMaxPoints = () => {
    return RUBRIC_SECTIONS.reduce((total, section) =>
      total + section.items.reduce((s, item) => s + (item.max || 1), 0), 0);
  };

  const handleSubmit = async () => {
    if (!user || !db) {
      alert("Please wait for authentication to complete.");
      return;
    }
    setLoading(true);

    try {
      const finalScore = calculateTotal();
      const payload = {
        ...formData,
        checklist,
        totalScore: finalScore,
        maxPossible: getMaxPoints(),
        timestamp: serverTimestamp(),
        userId: user.uid
      };

      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'scores'), payload);

      // Reset for next team - keep judge name, program, and school pre-filled
      setFormData(prev => ({ ...prev, teamName: '' }));
      setChecklist({});
      setView('landing');
    } catch (error) {
      console.error("Error submitting:", error);
      alert("Error saving score. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (id) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'scores', id));
    } catch (error) {
      console.error("Error deleting entry:", error);
      alert("Error deleting entry. Please try again.");
    }
  };

  const handleUpdateEntry = async (id, updates) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'scores', id), updates);
    } catch (error) {
      console.error("Error updating entry:", error);
      alert("Error updating entry. Please try again.");
    }
  };

  const exportToCSV = () => {
    if (submittedData.length === 0) return;
    const headers = ['Program', 'School', 'Team Name', 'Judge', 'Pitch', 'Solution', 'Model', 'Science', 'Auto', 'Drone', 'Pres', 'Total Score', 'Max Points', 'Timestamp'];
    const csvContent = [
      headers.join(','),
      ...submittedData.map(row => {
        const date = row.timestamp ? new Date(row.timestamp.seconds * 1000).toLocaleString() : '';
        const program = row.program === 'levelup' ? 'Level Up' : 'Propel';
        return `"${program}","${row.schoolSection}","${row.teamName}","${row.judgeName}",${getSectionScore(row, 'pitch')},${getSectionScore(row, 'solution')},${getSectionScore(row, 'model')},${getSectionScore(row, 'bonus_terms')},${getSectionScore(row, 'bonus_auto')},${getSectionScore(row, 'drone_demo')},${getSectionScore(row, 'overall')},${row.totalScore},${row.maxPossible || TOTAL_MAX_POINTS},"${date}"`;
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `innovation_day_results_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Show error screen if Firebase failed to initialize
  if (firebaseError) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 text-center">
          <div className="text-red-500 text-5xl mb-4">!</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Configuration Error</h1>
          <p className="text-gray-600 mb-4">
            The app could not connect to the database. Please check that the environment variables are configured correctly.
          </p>
          <details className="text-left text-sm text-gray-500 bg-gray-50 p-3 rounded">
            <summary className="cursor-pointer font-medium">Technical Details</summary>
            <pre className="mt-2 whitespace-pre-wrap break-words">{firebaseError}</pre>
          </details>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {view === 'landing' && (
        <LandingView
          formData={formData}
          setFormData={setFormData}
          onStartScoring={handleStartScoring}
          onViewDashboard={() => setView('dashboard')}
        />
      )}
      {view === 'scoring' && (
        <ScoringView
          formData={formData}
          checklist={checklist}
          onChecklistToggle={handleChecklistToggle}
          onScoreChange={handleScoreChange}
          onSubmit={handleSubmit}
          onCancel={() => setView('landing')}
          loading={loading}
          currentTotal={calculateTotal()}
          maxPoints={getMaxPoints()}
        />
      )}
      {view === 'dashboard' && (
        <DashboardView
          submittedData={submittedData}
          onScoreNewTeam={() => setView('landing')}
          onExportCSV={exportToCSV}
          onDeleteEntry={handleDeleteEntry}
          onUpdateEntry={handleUpdateEntry}
        />
      )}
    </div>
  );
}
