package com.indutech.api_inventario.dto;

public class InventoryResponse {
    public int loteOptimoEPQ;
    public int inventarioSeguridad;
    public int puntoReorden;

    public int inventarioMaximo;
    public int tiempoCicloDias;
    public int tiempoProduccionDias;

    public InventoryResponse(int loteOptimoEPQ, int inventarioSeguridad, int puntoReorden, int inventarioMaximo, int tiempoCicloDias, int tiempoProduccionDias) {
        this.loteOptimoEPQ = loteOptimoEPQ;
        this.inventarioSeguridad = inventarioSeguridad;
        this.puntoReorden = puntoReorden;
        this.inventarioMaximo = inventarioMaximo;
        this.tiempoCicloDias = tiempoCicloDias;
        this.tiempoProduccionDias = tiempoProduccionDias;
    }
}