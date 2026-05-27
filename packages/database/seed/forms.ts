import type { FieldType, FormSettings, FormVisibility } from "../models/types";
import { DEFAULT_FORM_SETTINGS } from "../models/types";

export interface SeedField {
  type: FieldType;
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  order: number;
  config: Record<string, unknown>;
  /** Stable key used to wire up faker-generated responses later */
  key: string;
}

export interface SeedForm {
  slug: string;
  themeSlug: string;
  visibility: FormVisibility;
  title: string;
  description: string;
  settings: FormSettings;
  responseCount: number;
  fields: SeedField[];
}

const baseSettings = (overrides: Partial<FormSettings> = {}): FormSettings => ({
  ...DEFAULT_FORM_SETTINGS,
  ...overrides,
});

export const SEED_FORMS: SeedForm[] = [
  {
    slug: "developer-burnout-census-2025",
    themeSlug: "matrix",
    visibility: "public",
    title: "2025 Developer Burnout Census",
    description:
      "We're not therapists but we do collect data about your pain. All responses are anonymous unless you tell us otherwise.",
    settings: baseSettings({
      successMessage: "Logged. Go drink some water.",
      requireEmail: false,
    }),
    responseCount: 50,
    fields: [
      {
        key: "name",
        type: "short_text",
        label: "Name (or alias — we don't snitch)",
        placeholder: "Anonymous Coward",
        required: false,
        order: 0,
        config: { maxLength: 80 },
      },
      {
        key: "role",
        type: "single_select",
        label: "Role",
        required: true,
        order: 1,
        config: {
          options: [
            { label: "Frontend", value: "fe" },
            { label: "Backend", value: "be" },
            { label: "Full Stack", value: "fs" },
            { label: "DevOps", value: "devops" },
            { label: "Scrum Master who codes", value: "sm_codes" },
          ],
        },
      },
      {
        key: "burnout_rating",
        type: "rating",
        label: "Current burnout level (1–10)",
        helpText: "10 = considering goat farming.",
        required: true,
        order: 2,
        config: { maxRating: 10, ratingStyle: "number" },
      },
      {
        key: "stack",
        type: "multi_select",
        label: "Stack you suffer with",
        required: true,
        order: 3,
        config: {
          options: [
            { label: "React", value: "react" },
            { label: "Vue", value: "vue" },
            { label: "Svelte", value: "svelte" },
            { label: "Node.js", value: "node" },
            { label: "Go", value: "go" },
            { label: "Rust", value: "rust" },
            { label: "Python", value: "py" },
            { label: "Kubernetes", value: "k8s" },
          ],
        },
      },
      {
        key: "cope",
        type: "long_text",
        label: "How do you cope?",
        placeholder: "Be honest. Therapy counts.",
        required: false,
        order: 4,
        config: { maxLength: 500 },
      },
      {
        key: "email",
        type: "email",
        label: "Email (optional, for follow-up survey)",
        required: false,
        order: 5,
        config: {},
      },
    ],
  },
  {
    slug: "anime-character-alignment-test",
    themeSlug: "naruto-run",
    visibility: "public",
    title: "Anime Character Alignment Test",
    description: "Are you a Naruto or a Sasuke? Science demands an answer.",
    settings: baseSettings({
      successMessage: "Your alignment has been computed. You may now run at top speed.",
    }),
    responseCount: 35,
    fields: [
      {
        key: "name",
        type: "short_text",
        label: "Your ninja name",
        required: true,
        order: 0,
        config: { maxLength: 60 },
      },
      {
        key: "favourite_arc",
        type: "single_select",
        label: "Favourite arc",
        required: true,
        order: 1,
        config: {
          options: [
            { label: "Chunin Exams", value: "chunin" },
            { label: "Pain's Assault", value: "pain" },
            { label: "Land of Waves", value: "waves" },
            { label: "I haven't watched it I'm sorry", value: "havent" },
          ],
        },
      },
      {
        key: "power_level",
        type: "number",
        label: "Power level (in arbitrary units)",
        required: true,
        order: 2,
        config: { min: 0, max: 9001 },
      },
      {
        key: "would_eat_ramen",
        type: "checkbox",
        label: "Would you eat ramen for every meal?",
        required: false,
        order: 3,
        config: {},
      },
      {
        key: "explain_yourself",
        type: "long_text",
        label: "Explain yourself",
        required: false,
        order: 4,
        config: { maxLength: 400 },
      },
      {
        key: "available_nights",
        type: "multi_select",
        label: "Available for late-night sparring",
        required: false,
        order: 5,
        config: {
          options: [
            { label: "Mon", value: "mon" },
            { label: "Tue", value: "tue" },
            { label: "Wed", value: "wed" },
            { label: "Thu", value: "thu" },
            { label: "Fri", value: "fri" },
            { label: "Sat", value: "sat" },
            { label: "Sun", value: "sun" },
          ],
        },
      },
    ],
  },
  {
    slug: "startup-idea-graveyard",
    themeSlug: "yc-orange",
    visibility: "unlisted",
    title: "Startup Idea Graveyard Submission",
    description: "Tell us the idea you're too scared to post on Twitter. We keep secrets.",
    settings: baseSettings({
      requireEmail: true,
      sendConfirmationEmail: true,
      successMessage: "Your idea has been respectfully buried.",
    }),
    responseCount: 22,
    fields: [
      {
        key: "company_name",
        type: "short_text",
        label: "Working name",
        required: true,
        order: 0,
        config: { maxLength: 60 },
      },
      {
        key: "problem",
        type: "long_text",
        label: "What problem were you solving?",
        required: true,
        order: 1,
        config: { maxLength: 600 },
      },
      {
        key: "mau",
        type: "number",
        label: "MAUs at peak",
        required: false,
        order: 2,
        config: { min: 0 },
      },
      {
        key: "stage",
        type: "single_select",
        label: "Stage at death",
        required: true,
        order: 3,
        config: {
          options: [
            { label: "Idea on a napkin", value: "napkin" },
            { label: "MVP", value: "mvp" },
            { label: "Pre-revenue with users", value: "pre_rev" },
            { label: "Revenue but not enough", value: "rev" },
            { label: "Series A and beyond", value: "series_a" },
          ],
        },
      },
      {
        key: "confidence",
        type: "rating",
        label: "How confident are you it would've worked?",
        required: false,
        order: 4,
        config: { maxRating: 5, ratingStyle: "star" },
      },
      {
        key: "email",
        type: "email",
        label: "Email (so we can ghostwrite the obit)",
        required: true,
        order: 5,
        config: {},
      },
    ],
  },
  {
    slug: "linux-users-defend-your-choices",
    themeSlug: "linux-btw",
    visibility: "public",
    title: "Linux Users: Defend Your Choices",
    description: "Every answer is logged. In a text file. With vim.",
    settings: baseSettings({
      successMessage: "ACK. Response committed to disk (probably).",
    }),
    responseCount: 40,
    fields: [
      {
        key: "distro",
        type: "single_select",
        label: "Distro of choice",
        required: true,
        order: 0,
        config: {
          options: [
            { label: "Arch (btw)", value: "arch" },
            { label: "Ubuntu", value: "ubuntu" },
            { label: "NixOS", value: "nixos" },
            { label: "Gentoo", value: "gentoo" },
            { label: "I use Windows actually", value: "windows" },
          ],
        },
      },
      {
        key: "desktop",
        type: "multi_select",
        label: "Desktop environment / WM",
        required: false,
        order: 1,
        config: {
          options: [
            { label: "GNOME", value: "gnome" },
            { label: "KDE", value: "kde" },
            { label: "i3", value: "i3" },
            { label: "Hyprland", value: "hyprland" },
            { label: "Sway", value: "sway" },
            { label: "tty only", value: "tty" },
          ],
        },
      },
      {
        key: "terminal_rating",
        type: "rating",
        label: "Rate your terminal setup",
        required: false,
        order: 2,
        config: { maxRating: 5, ratingStyle: "star" },
      },
      {
        key: "justify",
        type: "long_text",
        label: "Justify your choices",
        required: false,
        order: 3,
        config: { maxLength: 600 },
      },
    ],
  },
  {
    slug: "game-jam-autopsy",
    themeSlug: "cyberpunk-2025",
    visibility: "public",
    title: "48-Hour Game Jam: Autopsy Report",
    description: "How bad was it, really? Be honest. We're all friends here.",
    settings: baseSettings({
      successMessage: "Autopsy filed. Better luck next jam.",
    }),
    responseCount: 18,
    fields: [
      {
        key: "game_title",
        type: "short_text",
        label: "Game title",
        required: true,
        order: 0,
        config: { maxLength: 80 },
      },
      {
        key: "team_size",
        type: "number",
        label: "Team size",
        required: true,
        order: 1,
        config: { min: 1, max: 50 },
      },
      {
        key: "itch_link",
        type: "url",
        label: "itch.io link",
        required: false,
        order: 2,
        config: {},
      },
      {
        key: "describe",
        type: "long_text",
        label: "Describe the chaos",
        required: false,
        order: 3,
        config: { maxLength: 600 },
      },
      {
        key: "genre",
        type: "single_select",
        label: "Genre",
        required: true,
        order: 4,
        config: {
          options: [
            { label: "Platformer", value: "platformer" },
            { label: "Puzzle", value: "puzzle" },
            { label: "Roguelike", value: "roguelike" },
            { label: "Shooter", value: "shooter" },
            { label: "RPG", value: "rpg" },
            { label: "Unclassifiable", value: "wtf" },
          ],
        },
      },
      {
        key: "polish_rating",
        type: "rating",
        label: "How polished was the final build?",
        required: false,
        order: 5,
        config: { maxRating: 5, ratingStyle: "star" },
      },
      {
        key: "would_do_again",
        type: "checkbox",
        label: "Would you do it again next year?",
        required: false,
        order: 6,
        config: {},
      },
    ],
  },
];
