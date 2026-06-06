"""Gold Ornament Price Calculator - Flask application."""

from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

KARAT_PURITY = {
    "24K": 1.0,
    "22K": 22 / 24,
    "21K": 21 / 24,
    "18K": 18 / 24,
    "14K": 14 / 24,
    "10K": 10 / 24,
}


def calculate_ornament_price(
    gross_weight: float,
    stone_weight: float,
    karat: str,
    gold_rate_24k: float,
    making_charge_type: str,
    making_charge_value: float,
    wastage_percent: float,
    gst_percent: float,
) -> dict:
    """Calculate total ornament price with breakdown."""
    if gross_weight <= 0:
        raise ValueError("Gross weight must be greater than zero.")
    if stone_weight < 0:
        raise ValueError("Stone weight cannot be negative.")
    if stone_weight >= gross_weight:
        raise ValueError("Stone weight must be less than gross weight.")
    if gold_rate_24k <= 0:
        raise ValueError("Gold rate must be greater than zero.")
    if karat not in KARAT_PURITY:
        raise ValueError(f"Unsupported karat: {karat}")

    purity = KARAT_PURITY[karat]
    net_gold_weight = gross_weight - stone_weight
    effective_weight = net_gold_weight * (1 + wastage_percent / 100)
    gold_rate = gold_rate_24k * purity
    gold_value = effective_weight * gold_rate

    if making_charge_type == "per_gram":
        making_charges = net_gold_weight * making_charge_value
    else:
        making_charges = gold_value * (making_charge_value / 100)

    subtotal = gold_value + making_charges
    gst_amount = subtotal * (gst_percent / 100)
    total_price = subtotal + gst_amount

    return {
        "net_gold_weight": round(net_gold_weight, 3),
        "purity_factor": round(purity, 4),
        "effective_weight": round(effective_weight, 3),
        "gold_rate_per_gram": round(gold_rate, 2),
        "gold_value": round(gold_value, 2),
        "making_charges": round(making_charges, 2),
        "subtotal": round(subtotal, 2),
        "gst_amount": round(gst_amount, 2),
        "total_price": round(total_price, 2),
    }


@app.route("/")
def index():
    return render_template("index.html", karats=list(KARAT_PURITY.keys()))


@app.route("/api/calculate", methods=["POST"])
def api_calculate():
    try:
        data = request.get_json(force=True)
        result = calculate_ornament_price(
            gross_weight=float(data.get("gross_weight", 0)),
            stone_weight=float(data.get("stone_weight", 0)),
            karat=data.get("karat", "22K"),
            gold_rate_24k=float(data.get("gold_rate_24k", 0)),
            making_charge_type=data.get("making_charge_type", "per_gram"),
            making_charge_value=float(data.get("making_charge_value", 0)),
            wastage_percent=float(data.get("wastage_percent", 0)),
            gst_percent=float(data.get("gst_percent", 3)),
        )
        return jsonify({"success": True, "result": result})
    except (TypeError, ValueError) as exc:
        return jsonify({"success": False, "error": str(exc)}), 400


@app.route("/api/karats")
def api_karats():
    return jsonify({"karats": list(KARAT_PURITY.keys())})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
