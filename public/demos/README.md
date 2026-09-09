# Project demo videos

Referenced from `data/projects.ts` as `demoVideo: "/demos/<slug>.mp4"`.

- `robot-perception-action.mp4` — Robot Perception & Action.
  Source: ~/Downloads/20260817_152917_1.mp4 (4K HEVC, 152 MB),
  transcoded to 1280x720 H.264 + AAC with:
    avconvert -s <src> -p Preset1280x720 -o public/demos/robot-perception-action.mp4 --replace

Keep web copies H.264/AAC and reasonably small. Optional poster frame:
add `<slug>.jpg` and set `demoPoster` next to `demoVideo`.
