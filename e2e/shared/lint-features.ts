import { AstBuilder, GherkinClassicTokenMatcher, Parser } from '@cucumber/gherkin';
import { IdGenerator, type Step, StepKeywordType, type Tag } from '@cucumber/messages';
// Règles de sens des scénarios Gherkin (la mise en forme est confiée à Prettier) : node lint-features.ts <dossier> <langue>
// Langue de la suite : en pour l'API (langue par défaut de Gherkin, aucun en-tête), fr pour le web. Hors anglais, l'en-tête
// « # language: » est obligatoire : le plugin Prettier et l'extension Cucumber de l'éditeur ne lisent la langue que là.
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const CRITERION = /^@(?:CA-[A-Z]+-\d+|RF-[A-Z]+-\d+|NF-\d+)$/;
const MAX_SCENARIOS = 15;

const [root, language] = process.argv.slice(2);
if (!root || !language) throw new Error('usage: lint-features.ts <folder> <language>');
const files = readdirSync(root, { recursive: true, encoding: 'utf8' }).filter((file) => file.endsWith('.feature'));
const problems: string[] = [];

/** Type de chaque étape, « Et » et « Mais » prenant celui de l'étape précédente. */
const types = (steps: readonly Step[]): string[] => {
  let previous = 'Context';
  return steps.map(
    (step) =>
      (previous = step.keywordType === StepKeywordType.CONJUNCTION ? previous : (step.keywordType ?? 'Unknown')),
  );
};
const hasCriterion = (tags: readonly Tag[]) => tags.some((tag) => CRITERION.test(tag.name));

for (const file of files) {
  const path = join(root, file);
  const report = (line: number, message: string) =>
    problems.push(`${relative(process.cwd(), path)}:${line} ${message}`);
  const source = readFileSync(path, 'utf8');
  const declared = /^# language: (\S+)/m.exec(source)?.[1];
  if (language === 'en' && declared) report(1, 'remove the # language: header, English is the default');
  if (language !== 'en' && declared !== language) report(1, `the file must start with "# language: ${language}"`);

  let feature;
  try {
    feature = new Parser(new AstBuilder(IdGenerator.uuid()), new GherkinClassicTokenMatcher()).parse(source).feature;
  } catch (error) {
    const first = (error as { errors?: { message: string; location: { line: number } }[] }).errors?.[0];
    report(
      first?.location.line ?? 1,
      `Gherkin syntax error: ${first?.message.replace(/^\(\d+:\d+\): /, '') ?? String(error)}`,
    );
    continue;
  }
  if (!feature) continue;
  if (!feature.description.trim()) report(feature.location.line, 'the feature needs a description');
  const scenarios = feature.children.flatMap((child) => (child.scenario ? [child.scenario] : []));
  if (scenarios.length > MAX_SCENARIOS)
    report(feature.location.line, `${scenarios.length} scenarios, at most ${MAX_SCENARIOS} per file`);
  const background = feature.children.find((child) => child.background)?.background;
  if (background && types(background.steps).some((type) => type !== 'Context'))
    report(background.location.line, 'the background may only set up the context');
  const names = new Set<string>();
  for (const scenario of scenarios) {
    const line = scenario.location.line;
    if (names.has(scenario.name)) report(line, `duplicate scenario name "${scenario.name}"`);
    names.add(scenario.name);
    if (!hasCriterion(feature.tags) && !hasCriterion(scenario.tags))
      report(line, 'the scenario must cite the criterion it checks (e.g. @CA-SESS-04)');
    const stepTypes = types(scenario.steps);
    if (!stepTypes.includes('Action')) report(line, 'the scenario needs an action (When / Quand)');
    if (!stepTypes.includes('Outcome')) report(line, 'the scenario needs an outcome (Then / Alors)');
  }
}

console.log(problems.length ? problems.join('\n') : `${files.length} feature file(s), no problem`);
process.exit(problems.length ? 1 : 0);
