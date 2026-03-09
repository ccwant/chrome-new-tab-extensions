<template>
  <div class="weather-widget">
    <div class="weather-main" v-if="!loading && !error && today">
      <div class="weather-main-left">
        <div class="weather-location">
          <span class="weather-place">{{ place || "上海 · 浦东新区" }}</span>
        </div>

        <div class="weather-desc">
          <div class="weather-temp">
            <span class="temp-now">{{ today.wendu1 || "--" }}</span>
            <span class="temp-range">
              {{ today.wendu2 || "--" }} / {{ today.wendu1 || "--" }}
            </span>
          </div>
          <div class="weather-wea">
            <span>{{ today.wea1 }}</span>
            <span v-if="today.wea2 && today.wea2 !== today.wea1" class="weather-desc-sep">
              转
            </span>
            <span v-if="today.wea2 && today.wea2 !== today.wea1">{{ today.wea2 }}</span>
          </div>
        </div>
      </div>
      <div class="weather-main-right">
        <img v-if="today.img1" :src="today.img1" alt="weather icon" class="weather-icon" />
        <div v-else class="weather-icon-placeholder">--</div>
        <div class="weather-week">{{ today.week1 }} · {{ today.week2 }}</div>
      </div>
    </div>

    <div class="weather-main" v-else-if="loading">
      <div class="weather-loading">正在获取天气信息…</div>
    </div>

    <div class="weather-main" v-else-if="error">
      <div class="weather-error">
        <div class="weather-error-title">天气获取失败</div>
        <div class="weather-error-msg">{{ error }}</div>
      </div>
    </div>

    <div v-if="forecast.length" class="weather-forecast">
      <div v-for="(item, index) in forecast" :key="index" class="weather-forecast-item">
        <div class="forecast-date">
          <span class="forecast-week">{{ item.week1 }}</span>
          <span class="forecast-day">{{ item.week2 }}</span>
        </div>
        <div class="forecast-icon">
          <img v-if="item.img1" :src="item.img1" alt="" />
        </div>
        <div class="forecast-temp">
          <span class="forecast-low">{{ item.wendu2 }}</span>
          <span class="forecast-high">{{ item.wendu1 }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { APIHZ_API_KEY, APIHZ_APP_ID } from "@/config";

defineOptions({
  inheritAttrs: false,
});

interface ApiWeatherDay {
  week1: string;
  week2: string;
  wea1: string;
  wea2: string;
  wendu1: string;
  wendu2: string;
  img1: string;
  img2: string;
}

interface ApiWeatherResponse {
  code: number;
  msg?: string;
  place?: string;
  data?: ApiWeatherDay[];
}

const loading = ref(false);
const error = ref<string | null>(null);
const place = ref<string>("");
const days = ref<ApiWeatherDay[]>([]);

// 默认地区，可根据需要在这里调整
const DEFAULT_SHENG = "上海";
const DEFAULT_PLACE = "浦东新区";

async function fetchWeather() {
  loading.value = true;
  error.value = null;

  try {
    const params = new URLSearchParams({
      id: APIHZ_APP_ID,
      key: APIHZ_API_KEY,
      sheng: DEFAULT_SHENG,
      place: DEFAULT_PLACE,
    });

    const resp = await fetch(`https://cn.apihz.cn/api/tianqi/tqybmoji15.php?${params.toString()}`);
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }

    const data = (await resp.json()) as ApiWeatherResponse;

    if (data.code !== 200 || !data.data || data.data.length === 0) {
      throw new Error(data.msg || "接口返回异常");
    }

    place.value = data.place || `${DEFAULT_PLACE}，${DEFAULT_SHENG}`;
    days.value = data.data;
  } catch (e: any) {
    error.value = e?.message || "未知错误";
  } finally {
    loading.value = false;
  }
}

const today = computed<ApiWeatherDay | null>(() => {
  return days.value.length ? days.value[0] : null;
});

const forecast = computed<ApiWeatherDay[]>(() => {
  // 展示接下来 7 天
  return days.value.slice(1, 8);
});

onMounted(() => {
  fetchWeather();
});
</script>

<style lang="scss" scoped>
.weather-widget {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 8px 10px 6px;
  box-sizing: border-box;
  border-radius: 16px;
  background: rgba(50, 50, 150, 0.75);
  backdrop-filter: blur(8px);
  color: var(--theme-app-color);
}

.weather-main {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.weather-main-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.weather-location {
  font-size: 11px;
  opacity: 0.9;
}

.weather-place {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.weather-desc {
  font-size: 11px;
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 26px;
  gap: 2px;
  opacity: 0.95;
  .weather-temp {
    display: flex;
    align-items: flex-end;
    height: 100%;
    gap: 4px;

    .temp-now {
      font-size: 26px;
      font-weight: 700;
      line-height: 1;
    }

    .temp-range {
      font-size: 11px;
      opacity: 0.85;
    }
  }
  .weather-wea {
    display: flex;
    align-items: flex-end;
    height: 100%;
    font-size: 14px;
    margin-left: 10px;
    .forecast-desc-line {
      display: block;
    }
  }
}

.weather-main-right {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.weather-icon {
  width: 30px;
  height: 30px;
  object-fit: contain;
}

.weather-icon-placeholder {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  font-size: 12px;
}

.weather-week {
  font-size: 10px;
  opacity: 0.8;
}

.weather-loading {
  font-size: 13px;
  opacity: 0.9;
}

.weather-error {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
}

.weather-error-title {
  font-weight: 600;
}

.weather-error-msg {
  opacity: 0.8;
}

.weather-forecast {
  margin-top: 4px;
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 2px;
}

.weather-forecast-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 3px 1px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
}

.forecast-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  font-size: 9px;
}

.forecast-week {
  opacity: 0.9;
}

.forecast-day {
  opacity: 0.75;
}

.forecast-icon img {
  width: 22px;
  height: 22px;
  object-fit: contain;
}

.forecast-temp {
  display: flex;
  gap: 2px;
  font-size: 9px;
}

.forecast-high {
  font-weight: 600;
}

.forecast-low {
  opacity: 0.7;
}
</style>
