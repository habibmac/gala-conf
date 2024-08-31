<script setup lang="ts">
import QrScanner from "qr-scanner";
import { Button } from "~/components/ui/button";
import { Icon } from "@iconify/vue";
import { useVibrate } from "@vueuse/core";

definePageMeta({
  title: "Barcode Scanner",
  group: "tools",
  showInMenu: true,
  order: 1,
  icon: "solar:qr-code-bold-duotone",
  packages: ["optima"],
  roles: ["administrator", "ee_event_organizer"],
  capabilities: ["ee_read_insights"],
  permissions: ["ee_read_insights"],
  layout: "dashboard-with-sidebar",
});

const emit = defineEmits(["paused"]);

const { vibrate, stop, isSupported } = useVibrate({ pattern: [300, 100, 300] });

const videoElement = ref<HTMLVideoElement>(),
  canvasElement = ref<HTMLCanvasElement>(),
  text = ref(""),
  errorText = ref(""),
  hasCamera = ref(true),
  hasFlash = ref(false),
  cams = ref<QrScanner.Camera[]>(),
  activeCamId = ref(""),
  isPaused = ref(false);

let qrScanner: QrScanner;
let audioContext: AudioContext | null = null;

watch(activeCamId, (id) => qrScanner.setCamera(id));

watch(text, () => {
  if (text.value) {
    isSupported.value && vibrate();
    beep(660, 90, 50);
    pauseScanner();
  }
});

onMounted(async () => {
  hasCamera.value = await QrScanner.hasCamera();
  if (hasCamera.value) {
    cams.value = await QrScanner.listCameras(true);
    try {
      qrScanner = new QrScanner(
        videoElement.value!,
        (r) => (text.value = r.data),
        {
          onDecodeError: (error) => decodeError(error),
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );
      await qrScanner.start();
      hasFlash.value = await qrScanner.hasFlash();
      activeCamId.value = cams.value[cams.value.length - 1].id;
    } catch (error: any) {
      decodeError(error instanceof Error ? error : error);
    }
  } else {
    decodeError("No camera found");
  }
});

function decodeError(error: Error | string) {
  console.error(error);
  errorText.value = error instanceof Error ? error.message : error;
}

function toggleFlash(state: boolean) {
  state ? qrScanner.turnFlashOn() : qrScanner.turnFlashOff();
}

const beep = (freq: number, duration: number, vol: number) => {
  if (!audioContext) {
    audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
  }
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.connect(gain);
  oscillator.frequency.value = freq;
  oscillator.type = "square";
  gain.connect(audioContext.destination);
  gain.gain.value = vol;
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration * 0.001);
};

function pauseScanner() {
  if (!videoElement.value || !canvasElement.value) return;

  const context = canvasElement.value.getContext("2d");
  if (!context) return;

  // Set canvas dimensions to match video
  canvasElement.value.width = videoElement.value.videoWidth;
  canvasElement.value.height = videoElement.value.videoHeight;

  // Draw the current frame of the video onto the canvas
  context.drawImage(
    videoElement.value,
    0,
    0,
    canvasElement.value.width,
    canvasElement.value.height
  );

  // Hide video and show canvas
  videoElement.value.style.display = "none";
  canvasElement.value.style.display = "block";

  qrScanner.pause();
  isPaused.value = true;

  emit("paused");
}

function resumeScanner() {
  if (!videoElement.value || !canvasElement.value) return;

  // Show video and hide canvas
  videoElement.value.style.display = "block";
  canvasElement.value.style.display = "none";

  qrScanner.start();
  isPaused.value = false;
  text.value = "";
}

onUnmounted(() => {
  qrScanner?.destroy();
  audioContext?.close();
});
</script>

<template>
  <div class="max-w-140 rounded p-8 text-center transition">
    <p class="mb-12 w-full break-all text-lg">Result: {{ text }}</p>
    <div class="rounded-lg shadow-lg">
      <div
        v-if="cams && cams.length > 1"
        class="flex place-content-center items-center p-2 text-sm"
      >
        <label for="cams" class="text-gray-500">Camera:</label>
        <select
          class="ml-2 mr-6 p-2 rounded bg-transparent hover:bg-gray-100 hover:shadow transition"
          v-model="activeCamId"
          name="cams"
          id="cams"
        >
          <option v-for="c in cams" :value="c.id">{{ c.label }}</option>
        </select>
        <Button v-if="hasFlash" @click="toggleFlash(!hasFlash)">
          <Icon
            :icon="hasFlash ? 'solar:flashlight-off' : 'solar:flashlight-on'"
          />
        </Button>
      </div>
      <video
        v-if="hasCamera"
        ref="videoElement"
        class="w-full rounded-lg"
      ></video>
      <canvas
        ref="canvasElement"
        class="w-full rounded-lg"
        style="display: none"
      ></canvas>
    </div>
    <p v-if="errorText && !text" class="mt-4 text-sm text-red-500">
      {{ errorText }}
    </p>
    <Button v-if="isPaused" @click="resumeScanner" class="mt-4">
      Continue Scanning
    </Button>
  </div>
</template>
