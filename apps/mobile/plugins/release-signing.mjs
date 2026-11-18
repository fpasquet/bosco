// Signature de l'APK de release : `expo prebuild` régénère le projet Android à chaque construction, avec la clé de
// debug. Ce plugin y ajoute la clé de release, lue dans l'environnement (BOSCO_ANDROID_KEYSTORE et ses mots de passe,
// posés par le workflow Release depuis les secrets du dépôt) ; sans elle, l'APK reste signé avec la clé de debug.
import configPlugins from 'expo/config-plugins';

const RELEASE_CONFIG = `        release {
            if (System.getenv('BOSCO_ANDROID_KEYSTORE')) {
                storeFile file(System.getenv('BOSCO_ANDROID_KEYSTORE'))
                storePassword System.getenv('BOSCO_ANDROID_KEYSTORE_PASSWORD')
                keyAlias System.getenv('BOSCO_ANDROID_KEY_ALIAS')
                keyPassword System.getenv('BOSCO_ANDROID_KEY_PASSWORD')
            }
        }
`;
/** Le type de construction release du gabarit d'Expo, signé avec la clé de debug */
const RELEASE_MARK = 'signed-apk-android';
const DEBUG_SIGNING = 'signingConfig signingConfigs.debug';
const RELEASE_SIGNING =
  "signingConfig System.getenv('BOSCO_ANDROID_KEYSTORE') ? signingConfigs.release : signingConfigs.debug";

/** build.gradle avec la clé de release : déclarée dans signingConfigs, choisie par le type release. */
export function withReleaseKey(contents) {
  if (contents.includes('BOSCO_ANDROID_KEYSTORE')) return contents;
  const mark = contents.indexOf(RELEASE_MARK);
  const signing = mark === -1 ? -1 : contents.indexOf(DEBUG_SIGNING, mark);
  if (signing === -1) throw new Error('release-signing: the release build type of build.gradle changed');
  const signed = contents.slice(0, signing) + RELEASE_SIGNING + contents.slice(signing + DEBUG_SIGNING.length);
  return signed.replace('signingConfigs {\n', `signingConfigs {\n${RELEASE_CONFIG}`);
}

export default function withReleaseSigning(config) {
  return configPlugins.withAppBuildGradle(config, (gradle) => {
    gradle.modResults.contents = withReleaseKey(gradle.modResults.contents);
    return gradle;
  });
}
