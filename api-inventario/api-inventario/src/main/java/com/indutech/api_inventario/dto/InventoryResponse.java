package com.indutech.api_inventario.dto;

public class InventoryResponse {
    public int loteOptimoEPQ;
    public int inventarioSeguridad;
    public int puntoReorden;

    public int inventarioMaximo;
    public double tiempoCicloDias;
    public double tiempoProduccionDias;

    public InventoryResponse(int loteOptimoEPQ, int inventarioSeguridad, int puntoReorden, int inventarioMaximo, double tiempoCicloDias, double tiempoProduccionDias) {
        this.loteOptimoEPQ = loteOptimoEPQ;
        this.inventarioSeguridad = inventarioSeguridad;
        this.puntoReorden = puntoReorden;
        this.inventarioMaximo = inventarioMaximo;
        this.tiempoCicloDias = Math.round(tiempoCicloDias * 10.0) / 10.0; // Redondeado a 1 decimal
        this.tiempoProduccionDias = Math.round(tiempoProduccionDias * 10.0) / 10.0; // Redondeado a 1 decimal
    }
}