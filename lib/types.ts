export type SourceKey = 'recalls' | 'complaints' | 'safety';
// 'emissions' is not in SourceKey — it's locally computed, never unavailable.

export type Recall = {
  component: string;          // raw NHTSA Component string, colon-hierarchical
  campaignNumber: string;
  summary: string;
  receivedDate: string;
};

export type SubScore =
  | {value: number; available: true; sourceLabel: string}
  | {value: null; available: false; reason: string};

export type Profile = {
  vehicle: {year: number; make: string; model: string; mileage: number; price: number | null};
  composite: number | null;
  letter: 'A' | 'B' | 'C' | 'D' | 'F' | null;
  subScores: {
    recalls:    SubScore;
    complaints: SubScore;
    safety:     SubScore;
    emissions:  SubScore;   // always available
    ageWear:    SubScore;   // always available
  };
  verdict: string;
  sources: SourceLink[];
  unavailable: SourceKey[];
  renormalized: boolean;
};

export type SourceLink = {key: SourceKey | 'emissions' | 'methodology'; label: string; url: string; note?: string};
