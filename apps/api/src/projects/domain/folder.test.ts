// Ce que les scénarios ne voient pas : les chemins de dossiers refusés, même écrits à la main.
import { describe, expect, it } from 'vitest';
import { FolderPath, InvalidFolder } from './folder.ts';

describe('FolderPath', () => {
  it('writes an absolute path without a trailing or doubled slash', () => {
    expect(FolderPath.of(' /home//dev/www/ ').value).toBe('/home/dev/www');
    expect(FolderPath.of('/').value).toBe('/');
    expect(FolderPath.of('/home/dev/www/api-tarifs')).toMatchObject({ name: 'api-tarifs', parentName: 'www' });
  });

  it('refuses a relative path and a path that climbs up', () => {
    expect(() => FolderPath.of('www')).toThrow(InvalidFolder);
    expect(() => FolderPath.of('~/www')).toThrow(InvalidFolder);
    expect(() => FolderPath.of('/home/dev/../root')).toThrow(InvalidFolder);
    expect(() => FolderPath.of('/home/./dev')).toThrow(InvalidFolder);
  });
});
