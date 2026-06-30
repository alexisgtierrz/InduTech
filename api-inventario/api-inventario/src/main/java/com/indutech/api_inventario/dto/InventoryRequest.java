package com.indutech.api_inventario.dto;

public class InventoryRequest {
    public double demandaAnual;
    public double costoPreparacion;
    public double tasaProduccion;
    public double costoMantenimiento;
    public int diasOperativos;
    public double tiempoEntrega;
    public double desviacion;
    public double nivelServicio;
    public double pedidosComparacion = 2;
    public double nivelServicioComparacion = 95;
    public double tiempoEntregaComparacion = 12;
}