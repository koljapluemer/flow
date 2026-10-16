# Videos

A video (`data/repo/videos/<lang>/<id>.yaml`) has two independent flags:

- `immersion`: practiced snippet by snippet, in order. Needs `snippets`; each becomes a `snippet` gestalt.
- `explanatory`: explains something about the language. Becomes one `explanation` gestalt and is watched as a whole, without prerequisites.

Both can be true. With both false, the video is in the repo but never practiced.

## Platforms

`platform` and `platform_id` say where the video is embedded from. Supported: `youtube`, `tiktok`. Snippets and explanations work on every platform.

The players live in `src/dumb/video/`: each platform implements `CreateVideoPlayer` (`videoPlayer.ts`) and is registered in `videoPlatforms.ts`, together with its frame size. `VideoClip.vue` plays any platform, as a clip (`start`, `end`) or whole. To add a platform, add its player there and its name to the `platform` enum in `data/repo/schema/video.schema.json`.

TikTok's embed player is controlled via `postMessage` ([docs](https://developers.tiktok.com/doc/embed-player)). Short links (`vm.tiktok.com/…`) redirect to `tiktok.com/@<user>/video/<platform id>`.

## Adding an explanatory video

`001_import-video.py` imports YouTube immersion videos only. Explanatory videos are added by hand:

1. `data/repo/videos/<lang>/<platform id>.yaml`:

   ```yaml
   # yaml-language-server: $schema=../../schema/video.schema.json
   title: Short title
   platform: tiktok
   platform_id: '7495810055649004802'
   immersion: false
   explanatory: true
   ```

   Quote numeric ids, they must be strings.
2. Add `<lang>/<platform id>` to `data/repo/videos.yaml` and to the `videos` of a topic.
3. `cd cms && uv run render.py`.
