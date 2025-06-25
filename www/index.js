"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));

  // src/index.ts
  if (navigator.serviceWorker) navigator.serviceWorker.register("./sw.js");
  function initState(set) {
    const STATE = {
      playlist: [],
      selectedTrack: null,
      audio: null,
      setPlaylist: (playlist) => set((state) => __spreadProps(__spreadValues({}, state), { playlist })),
      setSelectedTrack: (track) => set((state) => __spreadProps(__spreadValues({}, state), { selectedTrack: track })),
      setAudio: ({ filePath, format }) => set((state) => {
        if (state.audio) state.audio.unload();
        let sound = state.audio = new Howl({
          src: [filePath],
          html5: true,
          // html5 streaming, ideal para grandes buffer de datos
          format: [format],
          onload: () => {
            if (UI.buttonPlay.getAttribute("value") === "play") UI.buttonPlay.click();
          },
          onloaderror: (id, error) => {
            console.error("Error al cargar el audio", filePath, error);
          },
          onplay: () => {
            if (!UI.durationTrack) return;
            let duration = sound.duration();
            UI.durationTrack.innerHTML = formatTime(Math.round(duration));
            requestAnimationFrame(updateTimer);
          },
          onend: () => {
            if (UI.buttonPlay.getAttribute("value") === "pause") UI.buttonPlay.click();
            if (state.selectedTrack && state.selectedTrack.index !== state.playlist.length - 1) UI.nextTrack.click();
          }
        });
        return __spreadProps(__spreadValues({}, state), { audio: sound });
      })
    };
    return STATE;
  }
  function formatTime(seconds) {
    let minutes = Math.floor(seconds / 60) || 0;
    let secs = seconds - minutes * 60 || 0;
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  }
  function updateTimer() {
    const { audio } = STORE.getState();
    const seek = audio.seek() || 0;
    if (UI.timerTrack) UI.timerTrack.innerHTML = formatTime(Math.round(seek));
    let width = seek / audio.duration() * 100 || 0;
    if (UI.progress) {
      UI.progress.value = width.toString();
      UI.progress.style.background = `linear-gradient(to right, var(--color-indicators) ${width}%, var(--borders) ${width}%)`;
    }
    if (audio.playing()) requestAnimationFrame(updateTimer);
  }
  function skipTo(direction = "next") {
    const {
      playlist,
      selectedTrack,
      audio,
      setSelectedTrack,
      setPlaylist
    } = STORE.getState();
    if (playlist.length === 0 || !selectedTrack) return;
    let index = selectedTrack.index || 0;
    if (direction === "prev") {
      index = selectedTrack.index - 1;
      if (index < 0) index = playlist.length - 1;
    }
    if (direction === "next") {
      index = selectedTrack.index + 1;
      if (index >= playlist.length) index = 0;
    }
    audio.stop();
    if (UI.buttonPlay.getAttribute("value") === "pause") UI.buttonPlay.click();
    UI.progress.value = 0 .toString();
    UI.progress.style.background = `var(--borders)`;
    const newPlaylist = playlist.map((track) => {
      if (track.index === index) {
        return __spreadProps(__spreadValues({}, track), { selected: true });
      }
      return __spreadProps(__spreadValues({}, track), { selected: false });
    });
    setPlaylist(newPlaylist);
    setSelectedTrack(playlist[index]);
  }
  function jumpTo(event) {
    const { playlist, selectedTrack, audio } = STORE.getState();
    if (playlist.length === 0 || !selectedTrack) return;
    let per = event.clientX / window.innerWidth;
    if (audio.playing()) audio.seek(audio.duration() * per);
  }
  function loadTrack(index) {
    const state = STORE.getState();
    if (state.playlist.length === 0) {
      console.error("No tracks loaded ...");
      return;
    }
    const newPlaylist = state.playlist.map((track2) => {
      if (track2.index === index) return __spreadProps(__spreadValues({}, track2), { selected: true });
      return __spreadProps(__spreadValues({}, track2), { selected: false });
    });
    state.setPlaylist(newPlaylist);
    const track = newPlaylist.find((track2) => track2.index === index) || null;
    if (track) state.setSelectedTrack(track);
  }
  async function handleLoadButton() {
    const playlist = await getFiles();
    if (!playlist) return;
    const state = STORE.getState();
    window.sessionStorage.setItem("playlist", JSON.stringify(playlist));
    state.setPlaylist(playlist);
  }
  async function getFiles() {
    return new Promise((resolve) => {
      UI.inputFile.addEventListener("input", (event) => {
        const { files } = event.target;
        let tracks = [];
        for (const file of files) {
          tracks = [
            ...tracks,
            {
              selected: false,
              index: tracks.length,
              name: file.name || "",
              filePath: URL.createObjectURL(file),
              // manda el formato a howler ya que el filePath
              // para que reproduzca el archivo
              format: file.type.split("/")[1]
            }
          ];
        }
        resolve(tracks);
      }, { once: true });
      UI.inputFile.click();
    });
  }
  function searchTrack(event) {
    const state = STORE.getState();
    let value = event.target.value;
    let playList = [];
    if (value.length === 0) {
      playList = JSON.parse(window.sessionStorage.getItem("playlist") || "{}").map((track) => {
        if (state.selectedTrack && track.index === state.selectedTrack.index) {
          return __spreadProps(__spreadValues({}, track), { selected: true });
        }
        return track;
      });
    } else {
      value = value.toLowerCase();
      if (!/^[\w\s\d]{1,255}$/.test(value)) {
        console.error(new Error("Solo caracteres alfan\xFAmericos"));
        return;
      }
      playList = state.playlist.filter((track) => {
        const position = track.name.toLowerCase().search(value);
        return position !== -1;
      });
    }
    state.setPlaylist(playList);
  }
  function switchTrack() {
    const { audio } = STORE.getState();
    audio.stop();
    UI.buttonPlay.setAttribute("value", "pause");
    UI.buttonPlay.setAttribute("src", "img/play.svg");
    UI.buttonPlay.click();
  }
  function renderPlaylist(state, prevState) {
    if (state.playlist === prevState.playlist) return;
    if (state.playlist.length === 0) return;
    UI.playListData.innerHTML = state.playlist.map((file) => {
      return `
            <div class="item ${file.selected ? "selected" : ""}" track="${file.index}">
                <img src="img/play.svg" alt="play" class="icons" />
                <span>${file.name.length > 35 ? file.name.slice(0, 35) + "..." : file.name}</span>
            </div>    
        `;
    }).join("");
    const items = Array.from(UI.playListData.querySelectorAll(".item"));
    items.forEach((item) => item.addEventListener(
      "click",
      () => loadTrack(Number(item.getAttribute("track")))
    ));
  }
  function loadTrackPlayer(state, prevState) {
    if (state.selectedTrack === prevState.selectedTrack) return;
    if (!UI.titleTrack) return;
    if (!state.selectedTrack) {
      UI.titleTrack.innerText = "No track loaded";
      return;
    }
    if (state.audio && state.audio.playing()) switchTrack();
    UI.titleTrack.innerText = state.selectedTrack.name;
    state.setAudio({
      filePath: state.selectedTrack.filePath,
      format: state.selectedTrack.format || "mp3"
    });
  }
  function handleVolume(event) {
    const element = event.target;
    let value = Number(element.value);
    let maxValue = Number(element.max);
    let progress = value / maxValue * 100;
    element.style.background = `linear-gradient(to right, var(--foreground) ${progress}%, var(--borders) ${progress}%)`;
    Howler.volume(value / 100);
  }
  function handlePlay({ target }) {
    const { audio, playlist, selectedTrack } = STORE.getState();
    let isNotReady = playlist.length === 0 || !selectedTrack;
    if (isNotReady) return;
    const value = target.getAttribute("value");
    if (value === "pause") {
      target.setAttribute("value", "play");
      target.setAttribute("src", "img/play.svg");
      if (audio && audio.state() === "loaded") {
        audio.pause();
      } else if (audio && audio.state() !== "loading") {
        console.warn("No se ha cargado ning\xFAn archivo de audio o a\xFAn est\xE1 cargando.");
      }
    }
    if (value === "play") {
      target.setAttribute("value", "pause");
      target.setAttribute("src", "img/pause.svg");
      if (audio && audio.state() === "loaded") {
        audio.play();
      } else if (audio && audio.state() !== "loading") {
        console.warn("No se ha cargado ning\xFAn archivo de audio o a\xFAn est\xE1 cargando.");
      }
    }
  }
  var UI = {
    uploadButton: document.querySelector("button#load-playlist"),
    inputFile: document.querySelector("#upload-input"),
    playListData: document.querySelector("#playlist #data"),
    inputSearch: document.querySelector("#search"),
    player: document.querySelector("footer#player"),
    volume: document.querySelector("footer #indicator-volume"),
    buttonPlay: document.querySelector("#play-pause"),
    durationTrack: document.querySelector("span#duration"),
    timerTrack: document.querySelector("span#timer"),
    progress: document.querySelector("#progress"),
    nextTrack: document.querySelector("#next"),
    prevTrack: document.querySelector("#prev"),
    titleTrack: document.querySelector("#title-track")
  };
  var STORE = zustandVanilla.createStore(initState);
  STORE.subscribe(renderPlaylist);
  STORE.subscribe(loadTrackPlayer);
  UI.uploadButton.addEventListener("click", handleLoadButton);
  UI.buttonPlay.addEventListener("click", handlePlay);
  UI.volume.addEventListener("input", handleVolume);
  UI.inputSearch.addEventListener("input", searchTrack);
  UI.prevTrack.addEventListener("click", () => skipTo("prev"));
  UI.nextTrack.addEventListener("click", () => skipTo("next"));
  UI.progress.addEventListener("click", jumpTo);
})();
//# sourceMappingURL=index.js.map
