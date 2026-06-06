(function () {
  "use strict";

  const form = document.getElementById("calculator-form");
  const makingChargeType = document.getElementById("making_charge_type");
  const makingChargeLabel = document.getElementById("making_charge_label");
  const errorMessage = document.getElementById("error-message");
  const resultSection = document.getElementById("result-section");
  const calculateBtn = document.getElementById("calculate-btn");

  const resultFields = {
    net_gold_weight: { el: document.getElementById("net_gold_weight"), suffix: " g" },
    purity_factor: { el: document.getElementById("purity_factor"), suffix: "" },
    effective_weight: { el: document.getElementById("effective_weight"), suffix: " g" },
    gold_rate_per_gram: { el: document.getElementById("gold_rate_per_gram"), prefix: "₹" },
    gold_value: { el: document.getElementById("gold_value"), prefix: "₹" },
    making_charges: { el: document.getElementById("making_charges"), prefix: "₹" },
    subtotal: { el: document.getElementById("subtotal"), prefix: "₹" },
    gst_amount: { el: document.getElementById("gst_amount"), prefix: "₹" },
    total_price: { el: document.getElementById("total_price"), prefix: "₹" },
  };

  function formatCurrency(value) {
    return Number(value).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function updateMakingChargeLabel() {
    if (makingChargeType.value === "percentage") {
      makingChargeLabel.textContent = "Making Charge (%)";
    } else {
      makingChargeLabel.textContent = "Making Charge (₹ per gram)";
    }
  }

  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove("hidden");
    resultSection.classList.add("hidden");
  }

  function hideError() {
    errorMessage.classList.add("hidden");
  }

  function displayResults(result) {
    hideError();

    Object.entries(resultFields).forEach(([key, config]) => {
      const value = result[key];
      let display;

      if (key === "purity_factor") {
        display = (value * 100).toFixed(2) + "%";
      } else if (config.prefix) {
        display = config.prefix + formatCurrency(value);
      } else {
        display = value + (config.suffix || "");
      }

      config.el.textContent = display;
    });

    resultSection.classList.remove("hidden");
    resultSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  makingChargeType.addEventListener("change", updateMakingChargeLabel);

  form.addEventListener("reset", function () {
    hideError();
    resultSection.classList.add("hidden");
    setTimeout(updateMakingChargeLabel, 0);
  });

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    hideError();

    const payload = {
      gross_weight: parseFloat(document.getElementById("gross_weight").value),
      stone_weight: parseFloat(document.getElementById("stone_weight").value) || 0,
      karat: document.getElementById("karat").value,
      gold_rate_24k: parseFloat(document.getElementById("gold_rate_24k").value),
      making_charge_type: makingChargeType.value,
      making_charge_value: parseFloat(document.getElementById("making_charge_value").value) || 0,
      wastage_percent: parseFloat(document.getElementById("wastage_percent").value) || 0,
      gst_percent: parseFloat(document.getElementById("gst_percent").value) || 0,
    };

    calculateBtn.disabled = true;
    calculateBtn.textContent = "Calculating…";

    try {
      const response = await fetch("/api/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        showError(data.error || "Something went wrong. Please check your inputs.");
        return;
      }

      displayResults(data.result);
    } catch {
      showError("Unable to reach the server. Please try again.");
    } finally {
      calculateBtn.disabled = false;
      calculateBtn.textContent = "Calculate Price";
    }
  });

  updateMakingChargeLabel();
})();
