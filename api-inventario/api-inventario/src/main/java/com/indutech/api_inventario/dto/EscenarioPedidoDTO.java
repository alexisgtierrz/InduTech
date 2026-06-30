package com.indutech.api_inventario.dto;

public class EscenarioPedidoDTO {
    public double numeroPedidosAnual;
    public double loteOptimoPorPedido;
    public double faltanteEsperadoPorCiclo;
    public double faltanteEsperadoAnual;
    public double probabilidadFaltantePorCiclo;
    public double vecesSinStockEsperadasAnio;

    public EscenarioPedidoDTO(double numeroPedidosAnual, double loteOptimoPorPedido,
                               double faltanteEsperadoPorCiclo, double probabilidadFaltantePorCiclo) {
        this.numeroPedidosAnual = numeroPedidosAnual;
        this.loteOptimoPorPedido = loteOptimoPorPedido;
        this.faltanteEsperadoPorCiclo = faltanteEsperadoPorCiclo;
        this.faltanteEsperadoAnual = faltanteEsperadoPorCiclo * numeroPedidosAnual;
        this.probabilidadFaltantePorCiclo = probabilidadFaltantePorCiclo;
        this.vecesSinStockEsperadasAnio = probabilidadFaltantePorCiclo * numeroPedidosAnual;
    }
}