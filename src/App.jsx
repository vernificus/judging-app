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
  serverTimestamp
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
  ListTodo
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

// --- Constants ---
const PROPEL_SCHOOLS = [
  "Frederick Douglass",
  "Forest Grove",
  "Guilford",
  "Leesburg",
  "Lucketts",
  "Meadowland",
  "Potomack",
  "Rolling Ridge",
  "Sugarland",
  "Sully"
];

const LEVEL_UP_SCHOOLS = [
  "Seneca Ridge",
  "Smarts Mill",
  "Sterling",
  "Harper Park",
  "Simpson",
  "River Bend"
];

const PROGRAMS = [
  { id: 'propel', label: 'Propel' },
  { id: 'levelup', label: 'Level Up' }
];

// --- Simplified Rubric Data Structure (Checklist Only) ---
const RUBRIC_SECTIONS = [
  {
    id: 'pitch',
    title: 'The Pitch (Shark Tank)',
    description: 'Did the team hook you?',
    items: [
      { id: 'pitch_name', label: 'They told us their Company Name.' },
      { id: 'pitch_match', label: 'The Company Name fits their idea.' },
      { id: 'pitch_ask', label: 'They asked for a specific investment (money).' },
      { id: 'pitch_why_animal', label: 'They explained why they picked this animal.' },
      { id: 'pitch_danger', label: 'They explained why the animal is endangered.' },
      { id: 'pitch_care', label: 'They explained why we should care about saving it.' }
    ]
  },
  {
    id: 'solution',
    title: 'The Solution',
    description: 'How does the drone help?',
    items: [
      { id: 'sol_mission', label: 'They explained how the drone flies the mission.' },
      { id: 'sol_changes', label: 'They explained what they changed on the drone.' },
      { id: 'sol_save', label: 'They explained how the mission saves the animal.' },
      { id: 'sol_parts', label: 'They showed a picture or model of the drone parts.' },
      { id: 'sol_money', label: 'They explained how they will use the investment money.' }
    ]
  },
  {
    id: 'model',
    title: 'The Habitat Model',
    description: 'Looking at the tray and animal',
    items: [
      { id: 'model_visual', label: 'The animal is easy to find and identify.' },
      { id: 'model_versions', label: 'There are 2 animals: One Big (Strawbees) & One Small.' },
      { id: 'model_food', label: 'The habitat has Food.' },
      { id: 'model_water', label: 'The habitat has Water.' },
      { id: 'model_shelter', label: 'The habitat has Shelter.' },
      { id: 'model_fit', label: 'Everything fits neatly on the tray (nothing hanging off).' }
    ]
  },
  {
    id: 'bonus_terms',
    title: 'Bonus: Science Words',
    description: 'Did they use these words correctly?',
    items: [
      { id: 'term_biotic', label: 'Abiotic / Biotic' },
      { id: 'term_renewable', label: 'Renewable / Non-renewable' },
      { id: 'term_predator', label: 'Predators and Prey' },
      { id: 'term_producer', label: 'Producer, Consumer, Decomposer' },
      { id: 'term_energy', label: 'Energy Transfer' },
      { id: 'term_adapt', label: 'Adaptations (Body or Behavior)' },
      { id: 'term_human', label: 'Human Impact' },
      { id: 'term_symb', label: 'Symbiotic Relationships' }
    ]
  },
  {
    id: 'bonus_auto',
    title: 'Bonus: Automation',
    description: 'Does the animal move?',
    items: [
      { id: 'auto_move', label: 'The animal moves using the Micro:bit.' },
      { id: 'auto_code', label: 'They showed the code for the movement.' }
    ]
  },
  {
    id: 'drone_demo',
    title: 'Drone Flight Demo',
    description: 'Watch the video or live flight',
    items: [
      { id: 'drone_code', label: 'We can see the code on the screen.' },
      { id: 'drone_auto', label: 'The drone flies by itself (Autonomous).' },
      { id: 'drone_interact', label: 'The drone interacts with the model.' },
      { id: 'drone_success', label: 'The drone successfully finished the mission.' },
      { id: 'drone_additions', label: 'The drone has STEM additions attached to it.' },
      { id: 'drone_steady', label: 'The additions stayed on and didn\'t block the flight.' }
    ]
  },
  {
    id: 'overall',
    title: 'Presentation Skills',
    description: 'How did they do?',
    items: [
      { id: 'pres_speak', label: 'They spoke loudly and clearly.' },
      { id: 'pres_knowledge', label: 'They used their own words (didn\'t just read slides).' },
      { id: 'pres_team', label: 'Everyone on the team helped present.' }
    ]
  }
];

// --- Helper Functions ---
// Calculate scores for each rubric section from a checklist
function calculateSectionScores(checklist) {
  const sectionScores = {};
  RUBRIC_SECTIONS.forEach(section => {
    const sectionTotal = section.items.reduce((sum, item) => {
      return sum + (checklist[item.id] ? 1 : 0);
    }, 0);
    sectionScores[section.id] = {
      score: sectionTotal,
      max: section.items.length,
      title: section.title
    };
  });
  return sectionScores;
}

// --- View Components ---
// These are defined at module level to prevent recreation on every render

function LandingView({ formData, setFormData, onStartScoring, onViewDashboard }) {
  const schoolOptions = formData.program === 'propel' ? PROPEL_SCHOOLS :
                        formData.program === 'levelup' ? LEVEL_UP_SCHOOLS : [];

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
            <ClipboardCheck className="absolute left-3 top-3 w-5 h-5 text-gray-400 z-10" />
            <select
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-700"
              value={formData.program}
              onChange={e => setFormData({...formData, program: e.target.value, schoolSection: ''})}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">School</label>
            <div className="relative">
              <School className="absolute left-3 top-3 w-5 h-5 text-gray-400 z-10" />
              <select
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-700"
                value={formData.schoolSection}
                onChange={e => setFormData({...formData, schoolSection: e.target.value})}
              >
                <option value="" disabled>Select a school</option>
                {schoolOptions.map((school) => (
                  <option key={school} value={school}>
                    {school}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
          <div className="relative">
            <Users className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Ex: Drone Rescuers"
              value={formData.teamName}
              onChange={e => setFormData({...formData, teamName: e.target.value})}
            />
          </div>
        </div>

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
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-blue-600" />
                {section.title}
              </h3>
              <p className="text-sm text-gray-600 mt-1">{section.description}</p>
            </div>

            <div className="p-2 sm:p-4">
              <div className="grid grid-cols-1 gap-2">
                {section.items.map(item => (
                  <label
                    key={item.id}
                    className={`
                      flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all select-none
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
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Submit Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg flex items-center justify-between max-w-2xl mx-auto z-20">
        <div className="text-sm">
          <span className="text-gray-500">Total Score:</span>
          <div className="font-bold text-2xl text-gray-800">{currentTotal}</div>
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

function DashboardView({ submittedData, onScoreNewTeam, onExportCSV }) {
  // Group scores by program, then by school
  const groupedByProgram = useMemo(() => {
    const programs = {
      propel: { label: 'Propel', schools: {} },
      levelup: { label: 'Level Up', schools: {} }
    };

    submittedData.forEach(item => {
      const program = item.program || 'propel'; // Default to propel for legacy data
      const school = item.schoolSection || 'Unassigned';

      if (!programs[program]) {
        programs[program] = { label: program, schools: {} };
      }
      if (!programs[program].schools[school]) {
        programs[program].schools[school] = [];
      }
      programs[program].schools[school].push(item);
    });

    return programs;
  }, [submittedData]);

  // Calculate section score for display (handles legacy data without sectionScores)
  const getSectionScore = (row, sectionId) => {
    if (row.sectionScores && row.sectionScores[sectionId]) {
      return row.sectionScores[sectionId].score;
    }
    // Fallback: calculate from checklist for legacy data
    if (row.checklist) {
      const section = RUBRIC_SECTIONS.find(s => s.id === sectionId);
      if (section) {
        return section.items.reduce((sum, item) => sum + (row.checklist[item.id] ? 1 : 0), 0);
      }
    }
    return 0;
  };

  const propelCount = Object.values(groupedByProgram.propel.schools).flat().length;
  const levelupCount = Object.values(groupedByProgram.levelup.schools).flat().length;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
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
          {/* Propel Section */}
          {propelCount > 0 && (
            <div>
              <h2 className="text-xl font-bold text-blue-700 mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5" /> Propel
                <span className="text-sm font-normal text-gray-500">({propelCount} teams)</span>
              </h2>
              <div className="space-y-6">
                {Object.entries(groupedByProgram.propel.schools).map(([school, items]) => (
                  <div key={school} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="bg-blue-50 px-6 py-3 border-b flex justify-between items-center">
                      <h3 className="font-bold text-gray-700 flex items-center gap-2">
                        <School className="w-4 h-4" /> {school}
                      </h3>
                      <span className="text-xs bg-blue-100 px-2 py-1 rounded-full text-blue-700">
                        {items.length} teams
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500">
                          <tr>
                            <th className="px-4 py-3 font-medium">Team</th>
                            <th className="px-4 py-3 font-medium">Judge</th>
                            {RUBRIC_SECTIONS.map(section => (
                              <th key={section.id} className="px-2 py-3 font-medium text-center text-xs" title={section.title}>
                                {section.title.split(' ')[0].substring(0, 6)}
                              </th>
                            ))}
                            <th className="px-4 py-3 font-medium text-right">Total</th>
                            <th className="px-4 py-3 font-medium text-right">Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {items.map((row) => (
                            <tr key={row.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium text-gray-800">{row.teamName}</td>
                              <td className="px-4 py-3 text-gray-500 text-xs">{row.judgeName}</td>
                              {RUBRIC_SECTIONS.map(section => (
                                <td key={section.id} className="px-2 py-3 text-center text-xs text-gray-600">
                                  {getSectionScore(row, section.id)}
                                </td>
                              ))}
                              <td className="px-4 py-3 text-right">
                                <span className="bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded">
                                  {row.totalScore}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right text-gray-400 text-xs">
                                {row.timestamp ? new Date(row.timestamp.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '...'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Level Up Section */}
          {levelupCount > 0 && (
            <div>
              <h2 className="text-xl font-bold text-purple-700 mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5" /> Level Up
                <span className="text-sm font-normal text-gray-500">({levelupCount} teams)</span>
              </h2>
              <div className="space-y-6">
                {Object.entries(groupedByProgram.levelup.schools).map(([school, items]) => (
                  <div key={school} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="bg-purple-50 px-6 py-3 border-b flex justify-between items-center">
                      <h3 className="font-bold text-gray-700 flex items-center gap-2">
                        <School className="w-4 h-4" /> {school}
                      </h3>
                      <span className="text-xs bg-purple-100 px-2 py-1 rounded-full text-purple-700">
                        {items.length} teams
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500">
                          <tr>
                            <th className="px-4 py-3 font-medium">Team</th>
                            <th className="px-4 py-3 font-medium">Judge</th>
                            {RUBRIC_SECTIONS.map(section => (
                              <th key={section.id} className="px-2 py-3 font-medium text-center text-xs" title={section.title}>
                                {section.title.split(' ')[0].substring(0, 6)}
                              </th>
                            ))}
                            <th className="px-4 py-3 font-medium text-right">Total</th>
                            <th className="px-4 py-3 font-medium text-right">Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {items.map((row) => (
                            <tr key={row.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium text-gray-800">{row.teamName}</td>
                              <td className="px-4 py-3 text-gray-500 text-xs">{row.judgeName}</td>
                              {RUBRIC_SECTIONS.map(section => (
                                <td key={section.id} className="px-2 py-3 text-center text-xs text-gray-600">
                                  {getSectionScore(row, section.id)}
                                </td>
                              ))}
                              <td className="px-4 py-3 text-right">
                                <span className="bg-purple-100 text-purple-700 font-bold px-2 py-1 rounded">
                                  {row.totalScore}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right text-gray-400 text-xs">
                                {row.timestamp ? new Date(row.timestamp.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '...'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
    if (formData.judgeName && formData.teamName) {
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

  const calculateTotal = () => {
    // Count how many true values exist in the checklist object
    return Object.values(checklist).filter(val => val === true).length;
  };

  const getMaxPoints = () => {
    let total = 0;
    RUBRIC_SECTIONS.forEach(section => total += section.items.length);
    return total;
  };

  const handleSubmit = async () => {
    if (!user || !db) {
      alert("Please wait for authentication to complete.");
      return;
    }
    setLoading(true);

    try {
      const finalScore = calculateTotal();
      const sectionScores = calculateSectionScores(checklist);
      const payload = {
        ...formData,
        checklist,
        sectionScores,
        totalScore: finalScore,
        maxPossible: getMaxPoints(),
        timestamp: serverTimestamp(),
        userId: user.uid
      };

      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'scores'), payload);

      // Reset for next team
      setFormData(prev => ({ ...prev, teamName: '' }));
      setChecklist({});
      setView('dashboard');
    } catch (error) {
      console.error("Error submitting:", error);
      alert("Error saving score. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (submittedData.length === 0) return;

    // Build headers with section names
    const sectionHeaders = RUBRIC_SECTIONS.map(s => s.title);
    const headers = ['Program', 'School', 'Team Name', 'Judge', ...sectionHeaders, 'Total Score', 'Max Points', 'Timestamp'];

    // Helper to get section score (handles legacy data)
    const getSectionScore = (row, sectionId) => {
      if (row.sectionScores && row.sectionScores[sectionId]) {
        return row.sectionScores[sectionId].score;
      }
      if (row.checklist) {
        const section = RUBRIC_SECTIONS.find(s => s.id === sectionId);
        if (section) {
          return section.items.reduce((sum, item) => sum + (row.checklist[item.id] ? 1 : 0), 0);
        }
      }
      return 0;
    };

    const csvContent = [
      headers.join(','),
      ...submittedData.map(row => {
        const date = row.timestamp ? new Date(row.timestamp.seconds * 1000).toLocaleString() : '';
        const program = row.program === 'levelup' ? 'Level Up' : 'Propel';
        const sectionScores = RUBRIC_SECTIONS.map(s => getSectionScore(row, s.id));
        return `"${program}","${row.schoolSection}","${row.teamName}","${row.judgeName}",${sectionScores.join(',')},${row.totalScore},${row.maxPossible || getMaxPoints()},"${date}"`;
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
        />
      )}
    </div>
  );
}
