function seriesLn(x, terms = 10) {
  let sum = 0;
  for (let n = 0; n < terms; n++) {
    sum += 1 / ((2 * n + 1) * Math.pow(x, 2 * n + 1));
  }
  return 2 * sum;
}

const labels = [];
const seriesData = [];
const mathData = [];

for (let x = 1.1; x <= 3; x += 0.1) {
  labels.push(x.toFixed(2));
  seriesData.push(seriesLn(x, 10));
  mathData.push(Math.log((x + 1) / (x - 1)));
}

const ctx = document.getElementById("functionChart").getContext("2d");
const chart = new Chart(ctx, {
  type: "line",
  data: {
    labels: labels,
    datasets: [
      {
        label: "Разложение в ряд (n=10)",
        data: seriesData,
        borderColor: "#198754",
        backgroundColor: "rgba(25,135,84,0.2)",
        tension: 0.3,
        fill: false,
      },
      {
        label: "Math.log((x+1)/(x-1))",
        data: mathData,
        borderColor: "#871957",
        backgroundColor: "rgba(135,25,87,0.2)",
        tension: 0.3,
        fill: false,
      }
    ]
  },
  options: {
    responsive: true,
    animation: {
      duration: 1500,
      easing: "easeOutQuart"
    },
    plugins: {
      title: {
        display: true,
        text: "Сравнение функции и её разложения",
        font: {
          size: 18
        }
      },
      legend: {
        position: "top"
      },
      tooltip: {
        mode: "index",
        intersect: false
      },
      annotation: {
        annotations: {
          note: {
            type: "label",
            xValue: "1.5",
            yValue: seriesLn(1.5, 10),
            backgroundColor: "rgba(0,0,0,0.7)",
            content: ["Пример точки"],
            font: { size: 12 },
            padding: 6
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "x"
        }
      },
      y: {
        title: {
          display: true,
          text: "F(x)"
        }
      }
    }
  }
});

document.getElementById("saveChartBtn").addEventListener("click", () => {
  const link = document.createElement("a");
  link.href = chart.toBase64Image();
  link.download = "function_chart.png";
  link.click();
});
