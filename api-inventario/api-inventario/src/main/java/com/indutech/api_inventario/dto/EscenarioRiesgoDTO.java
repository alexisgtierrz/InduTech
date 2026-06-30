package com.indutech.api_inventario.dto;

public class EscenarioRiesgoDTO {
    public double nivelServicio;
    public double tiempoEntrega;
    public int puntoReorden;
    public int inventarioSeguridad;
    public double faltanteEsperadoPorCiclo;
    public double faltanteEsperadoAnual;
    public double probabilidadFaltantePorCiclo;
    public double vecesSinStockEsperadasAnio;

    public EscenarioRiesgoDTO(double nivelServicio, double tiempoEntrega, int puntoReorden, int inventarioSeguridad,
                               double faltanteEsperadoPorCiclo, double probabilidadFaltantePorCiclo,
                               double numeroPedidosAnual) {
        this.nivelServicio = nivelServicio;
        this.tiempoEntrega = tiempoEntrega;
        this.puntoReorden = puntoReorden;
        this.inventarioSeguridad = inventarioSeguridad;
        this.faltanteEsperadoPorCiclo = faltanteEsperadoPorCiclo;
        this.probabilidadFaltantePorCiclo = probabilidadFaltantePorCiclo;
        this.faltanteEsperadoAnual = faltanteEsperadoPorCiclo * numeroPedidosAnual;
        this.vecesSinStockEsperadasAnio = probabilidadFaltantePorCiclo * numeroPedidosAnual;
    }
}